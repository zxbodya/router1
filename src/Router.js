import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { merge as mergeStatic } from 'rxjs/observable/merge';
import { of } from 'rxjs/observable/of';

import { mergeMap } from 'rxjs/operators/mergeMap';
import { switchMap } from 'rxjs/operators/switchMap';
import { map } from 'rxjs/operators/map';
import { tap } from 'rxjs/operators/tap';
import { noop } from 'rxjs/util/noop';

import {
  parse as parseQuery,
  generate as generateQuery,
} from './utils/queryString';

import { StateHandler } from './StateHandler';

export class Router {
  constructor({
    history,
    routeCollection,
    loadState,
    onHashChange,
    renderState,
    afterRender,
  }) {
    this.history = history;
    this.routeCollection = routeCollection;

    this.activeRoute = [null, {}, null];
    this.currentLocation = {};

    this.resultsSubscription = null;
    this.renderResult$ = new Subject();

    this.loadState = loadState;
    this.onHashChange = onHashChange || noop;
    this.renderState = renderState;
    this.afterRender = afterRender || noop;

    this.navigate$ = new Subject();
  }

  createHandler(transition) {
    const state$ = this.loadState(transition);
    return state$.pipe(
      map(state => state && new StateHandler(state, transition))
    );
  }

  onBeforeUnload() {
    return this.activeRoute[2] ? this.activeRoute[2].onBeforeUnload() : '';
  }

  start() {
    const transitionFromLocation = toLocation =>
      Observable.create(observer => {
        let redirectCount = 0;
        let forwardInt;
        // defer redirect to new state to prevent subscription new render() result before old in edge cases
        const forward = redirectUrl => setTimeout(forwardInt, 0, redirectUrl);
        forwardInt = redirectUrl => {
          if (redirectCount > 20) {
            observer.error(Error('To many redirects!'));
          }

          this.history.replace(redirectUrl);

          const location = Object.assign(this.history.parseUrl(redirectUrl), {
            source: 'replace',
            state: {},
          });

          if (
            this.currentLocation.pathname === location.pathname &&
            this.currentLocation.search === location.search
          ) {
            if (this.currentLocation.hash === location.hash) {
              observer.error(Error('Redirect to the same location!'));
            }
            this.activeRoute[2].onHashChange(location);
            this.currentLocation = location;
          } else {
            this.currentLocation = location;

            redirectCount += 1;
            observer.next({
              location,
              router: this,
              redirectCount,
              forward,
            });
          }
        };
        observer.next({
          location: toLocation,
          router: this,
          redirectCount,
          forward,
        });
      });

    const historyTransition$ = this.history.location.pipe(
      mergeMap(location => {
        if (
          this.currentLocation.pathname === location.pathname &&
          this.currentLocation.search === location.search
        ) {
          this.activeRoute[2].onHashChange(location);
          this.currentLocation = location;
          return [];
        }

        const beforeUnload = this.onBeforeUnload();
        // eslint-disable-next-line no-restricted-globals,no-alert
        const cancelTransition = beforeUnload && !confirm(beforeUnload);
        if (cancelTransition) {
          // todo: find better way to revert location change
          this.history.push(
            this.history.createUrl(
              this.currentLocation.pathname,
              this.currentLocation.search,
              this.currentLocation.hash
            ),
            this.currentLocation.state
          );
          return [];
        }

        this.currentLocation = location;
        return [location];
      })
    );

    const navigateTransition$ = this.navigate$.pipe(
      mergeMap(({ url, state, source }) => {
        const location = Object.assign(this.history.parseUrl(url), {
          source,
          state,
        });

        if (
          this.currentLocation.pathname === location.pathname &&
          this.currentLocation.search === location.search
        ) {
          this.activeRoute[2].onHashChange(location);
          this.currentLocation = location;
          this.history.push(url, state);
          return [];
        }

        const beforeUnload = this.onBeforeUnload();
        // eslint-disable-next-line no-restricted-globals,no-alert
        const cancelTransition = beforeUnload && !confirm(beforeUnload);

        if (cancelTransition) {
          return [];
        }

        this.currentLocation = location;
        this.history.push(url, state);

        return [location];
      })
    );

    this.resultsSubscription = mergeStatic(
      historyTransition$,
      navigateTransition$
    )
      .pipe(
        mergeMap(transitionFromLocation),
        // transition handling
        map(transition =>
          Object.assign({}, transition, {
            routes: this.routeCollection.match(
              transition.location.pathname,
              parseQuery(transition.location.search)
            ),
          })
        ),
        switchMap(transition => {
          const loadRoute = (routes, index) => {
            if (index >= routes.length) {
              return this.createHandler(
                Object.assign(
                  { route: { name: null, handlers: [] }, params: {} },
                  transition
                )
              ).pipe(map(v => [null, {}, v]));
            }

            const route = routes[index];
            const handler = this.createHandler(
              Object.assign({ route: route[0], params: route[1] }, transition)
            );
            return handler.pipe(
              switchMap(
                loadResult =>
                  loadResult
                    ? of([route[0].name, route[1], loadResult])
                    : loadRoute(routes, index + 1)
              )
            );
          };

          return loadRoute(transition.routes, 0);
        }),
        tap(([route, params, handler]) => {
          this.activeRoute = [route, params, handler];
        }),
        switchMap(() => this.activeRoute[2].render())
      )
      .subscribe({
        next: v => {
          this.renderResult$.next(v);
        },
        error: e => {
          if (this.renderResult$.observers.length) this.renderResult$.error(e);
          else throw e;
        },
        complete: v => {
          this.renderResult$.complete(v);
        },
      });
  }

  stop() {
    if (this.resultsSubscription) {
      this.resultsSubscription.unsubscribe();
    }
  }

  renderResult() {
    return this.renderResult$;
  }

  isActive(route, params) {
    const activeRoute = this.activeRoute[0];
    if (!activeRoute || activeRoute.substr(0, route.length) !== route) {
      return false;
    }

    const activeRouteParams = this.activeRoute[1];

    let paramName;
    const has = Object.prototype.hasOwnProperty;

    for (paramName in params) {
      if (
        has.call(params, paramName) &&
        `${params[paramName]}` !== `${activeRouteParams[paramName]}`
      ) {
        return false;
      }
    }
    return true;
  }

  createUrl(name, params = {}, hash = '') {
    const route = this.routeCollection.getByName(name);
    if (route) {
      const pathname = route.generatePath(
        Object.assign({}, this.activeRoute[1], params)
      );
      const search = generateQuery(params, route.searchParams);
      return this.history.createUrl(pathname, search, hash);
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(`Route "${name}" not found`);
      return `#route-${name}-not-found`;
    }
    return '#';
  }

  navigate(route, params = {}, hash = '', state = {}) {
    const url = this.createUrl(route, params, hash);
    this.navigateToUrl(url, state);
  }

  navigateToUrl(url, state = {}) {
    this.navigate$.next({ url, state, source: 'push' });
  }
}
