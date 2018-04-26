import { Observable, Subject, merge, of, noop } from 'rxjs';

import { mergeMap, switchMap, map } from 'rxjs/operators';

import {
  parse as parseQuery,
  generate as generateQuery,
} from './utils/queryString';

import { StateHandler } from './StateHandler';
import { normalizeParams } from './normalizeParams';

export class Router {
  constructor(config) {
    this.history = config.history;
    this.routeCollection = config.routeCollection;

    this.activeRoute = ['', {}, null];
    this.currentLocation = {
      pathname: '',
      search: '',
      hash: '',
      state: null,
    };

    this.resultsSubscription = null;
    this.renderResult$ = new Subject();

    this.loadState = config.loadState;
    this.onHashChange = config.onHashChange || noop;
    this.renderState = config.renderState;
    this.afterRender = config.afterRender || noop;

    this.navigate$ = new Subject();
  }

  createHandler(transition) {
    const state$ = this.loadState(transition);
    return state$.pipe(
      map(state => (state ? new StateHandler(state, transition) : null))
    );
  }

  createNotFoundHandler(transition) {
    const notFoundTransition = {
      // todo: better typing, to separate matched route
      route: {
        name: '',
        handlers: [],
      },
      params: {},
      ...transition,
      router: this,
    };
    const state$ = this.loadState(notFoundTransition);
    return state$.pipe(
      map(state => new StateHandler(state, notFoundTransition))
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
        const forward = redirectUrl => {
          setTimeout(forwardInt, 0, redirectUrl);
        };
        forwardInt = redirectUrl => {
          if (redirectCount > 20) {
            observer.error(Error('To many redirects!'));
          }

          this.history.replace(redirectUrl);

          const location = {
            ...this.history.parseUrl(redirectUrl),
            source: 'replace',
            state: {},
          };

          if (
            this.currentLocation.pathname === location.pathname &&
            this.currentLocation.search === location.search
          ) {
            if (this.currentLocation.hash === location.hash) {
              observer.error(Error('Redirect to the same location!'));
            }
            if (this.activeRoute[2]) this.activeRoute[2].onHashChange(location);
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
          if (this.activeRoute[2]) this.activeRoute[2].onHashChange(location);
          this.currentLocation = location;
          return [];
        }

        const beforeUnload = this.onBeforeUnload();
        // eslint-disable-next-line no-restricted-globals,no-alert
        const cancelTransition = beforeUnload && !confirm(beforeUnload);
        if (cancelTransition) {
          // case when user navigates back or forward, but transition was canceled
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
        const location = {
          ...this.history.parseUrl(url),
          source,
          state,
        };

        if (
          this.currentLocation.pathname === location.pathname &&
          this.currentLocation.search === location.search
        ) {
          if (this.activeRoute[2]) this.activeRoute[2].onHashChange(location);
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
    const matchRoutes = transition => ({
      ...transition,
      routes: this.routeCollection.match(
        transition.location.pathname,
        parseQuery(transition.location.search)
      ),
    });

    const loadMatched = transition => {
      const loadRoute = (routes, index) => {
        if (index >= routes.length) {
          // not found
          return of(['', {}, null]);
        }

        const route = routes[index];
        const handler = this.createHandler({
          route: route[0],
          params: route[1],
          ...transition,
        });
        return handler.pipe(
          switchMap(
            loadResult =>
              loadResult
                ? of([route[0].name, route[1], loadResult])
                : loadRoute(routes, index + 1)
          )
        );
      };

      return loadRoute(transition.routes, 0).pipe(
        mergeMap(
          ([routeName, routeParams, handler]) =>
            handler
              ? of([routeName, routeParams, handler])
              : this.createNotFoundHandler(transition).pipe(
                  map(v => [routeName, routeParams, v])
                )
        )
      );
    };

    const activateLoaded = ([route, params, handler]) => {
      this.activeRoute = [route, params, handler];
      return this.activeRoute[2].render();
    };

    this.resultsSubscription = merge(historyTransition$, navigateTransition$)
      .pipe(
        switchMap(transitionFromLocation),
        // transition handling
        map(matchRoutes),
        switchMap(loadMatched),
        switchMap(activateLoaded)
      )
      .subscribe(
        v => {
          this.renderResult$.next(v);
        },
        e => {
          if (this.renderResult$.observers.length) this.renderResult$.error(e);
          // eslint-disable-next-line no-console
          else console.error(e);
        }
      );
  }

  stop() {
    if (this.resultsSubscription) {
      this.resultsSubscription.unsubscribe();
    }
  }

  renderResult() {
    return this.renderResult$;
  }

  isActive(route, params = {}) {
    const activeRoute = this.activeRoute[0];
    if (!activeRoute || activeRoute.substr(0, route.length) !== route) {
      return false;
    }

    const activeRouteParams = this.activeRoute[1];

    let paramName;
    const has = Object.prototype.hasOwnProperty;

    const normalizedParams = normalizeParams(
      this.routeCollection.getByName(this.activeRoute[0]).searchParams,
      params
    );
    for (paramName in normalizedParams) {
      if (
        has.call(normalizedParams, paramName) &&
        normalizedParams[paramName] !== activeRouteParams[paramName]
      ) {
        return false;
      }
    }
    return true;
  }

  createUrl(name, params = {}, hash = '') {
    const route = this.routeCollection.getByName(name);
    if (route) {
      const pathname = route.generatePath({
        ...this.activeRoute[1],
        ...params,
      });
      const search = generateQuery(params, route.searchParams);
      return this.history.createUrl(pathname, search, hash);
    }
    /* istanbul ignore else */
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
