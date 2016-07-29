import { Observable, Subject, ReplaySubject } from 'rx';
import { compileRoutes } from './compileRoutes';
import {
  parse as parseQuery,
  generate as generateQuery,
  pickValues as pickQueryValues,
} from './utils/queryString';

export class Router {
  constructor({ history, routes, createHandler }) {
    this.history = history;
    this.routes = [];

    this.routesByName = {};
    this.addRoutes(routes);

    this.activeRoute = [null, {}, null];
    this.currentLocation = {};

    this.resultsSubscription = null;
    this.renderResult$ = new ReplaySubject(1);

    this.createHandler = createHandler;

    this.navigate$ = new Subject();
  }

  onBeforeUnload() {
    return this.activeRoute[2] ? this.activeRoute[2].onBeforeUnload() : '';
  }

  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route => {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  start() {
    const transitionFromLocation = (toLocation) =>
      Observable.create(observer => {
        let redirectCount = 0;
        const forward = (redirectUrl) => {
          if (redirectCount > 20) {
            observer.onError(Error('To many redirects!'));
          }

          this.history.replace(redirectUrl);

          const location = Object.assign(this.history.parseUrl(redirectUrl), { source: 'replace', state: {} });

          if (this.currentLocation.pathname === location.pathname && this.currentLocation.search === location.search) {
            if (this.currentLocation.hash === location.hash) {
              observer.onError(Error('Redirect to the same location!'));
            }
            this.activeRoute[2].hashChange(location);
            this.currentLocation = location;
          } else {
            this.currentLocation = location;

            redirectCount += 1;
            observer.onNext({
              location,
              router: this,
              redirectCount,
              forward,
            });
          }
        };
        return observer.onNext({
          location: toLocation,
          router: this,
          redirectCount,
          forward,
        });
      });

    const historyTransition$ = this.history
      .location
      .flatMap(location => {
        if (this.currentLocation.pathname === location.pathname && this.currentLocation.search === location.search) {
          this.activeRoute[2].hashChange(location);
          this.currentLocation = location;
          return [];
        }

        const beforeUnload = this.onBeforeUnload();
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
      });


    const navigateTransition$ = this.navigate$
      .flatMap(({ url, state, source }) => {
        const location = Object.assign(
          this.history.parseUrl(url),
          { source, state }
        );

        if (this.currentLocation.pathname === location.pathname && this.currentLocation.search === location.search) {
          this.activeRoute[2].hashChange(location);
          this.currentLocation = location;
          this.history.push(url, state);
          return [];
        }

        const beforeUnload = this.onBeforeUnload();
        const cancelTransition = beforeUnload && !confirm(beforeUnload);

        if (cancelTransition) {
          return [];
        }

        this.currentLocation = location;
        this.history.push(url, state);

        return [location];
      });


    this.resultsSubscription = Observable.merge(
      historyTransition$,
      navigateTransition$
    )
      .flatMap(transitionFromLocation)
      // transition handling
      .map(transition => {
        const { location } = transition;
        const queryData = parseQuery(location.search);
        const matched = [];

        for (let i = 0, l = this.routes.length; i < l; i++) {
          const route = this.routes[i];
          const params = route.matchPath(location.pathname);
          if (params) {
            matched.push([
              route,
              Object.assign(
                params,
                pickQueryValues(queryData, route.searchParams)
              )]);
          }
        }

        return Object.assign(
          {},
          transition,
          {
            routes: matched,
          }
        );
      })
      .flatMapLatest(transition => {
        const loadRoute = (routes, index) => {
          if (index >= routes.length) {
            return this.createHandler(
              Object.assign({ route: { name: null, handlers: [] }, params: {} }, transition)
            ).map(v => [null, {}, v]);
          }

          const route = routes[index];
          const handler = this.createHandler(
            Object.assign({ route: route[0], params: route[1] }, transition)
          );
          return handler.flatMapLatest(loadResult => (
            loadResult
              ? Observable.return([route[0].name, route[1], loadResult])
              : loadRoute(routes, index + 1)
          ));
        };

        return loadRoute(transition.routes, 0);
      })
      .do(([route, params, handler]) => {
        this.activeRoute = [route, params, handler];
      })
      .flatMapLatest(() => this.activeRoute[2].render())
      .subscribe(
        this.renderResult$
      );
  }

  stop() {
    if (this.resultsSubscription) {
      this.resultsSubscription.dispose();
    }
  }

  renderResult() {
    if (!this.resultsSubscription) {
      this.start();
    }
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
      if (has.call(params, paramName) && `${params[paramName]}` !== `${activeRouteParams[paramName]}`) {
        return false;
      }
    }
    return true;
  }

  createUrl(name, params = {}, hash = '') {
    const route = this.routesByName[name];
    if (route) {
      const pathname = route.generatePath(Object.assign({}, this.activeRoute[1], params));
      const search = generateQuery(params, route.searchParams);
      return this.history.createUrl(pathname, search, hash);
    }
    if (process.env.NODE_ENV !== 'production') {
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
    this.navigate$.onNext({ url, state, source: 'push' });
  }

}
