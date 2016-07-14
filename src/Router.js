import { compileRoutes } from './compileRoutes';
import { Observable, Subject } from 'rx';
import {
  parse as parseQuery,
  generate as generateQuery,
  pickValues as pickQueryValues,
} from './utils/queryString';

export class Router {
  constructor({ history, routes, createNotFoundHandler, createHandler }) {
    this.history = history;
    this.routes = [];

    this.routesByName = {};
    this.addRoutes(routes);

    this.activeRoute = [null, {}, null];
    this.currentLocation = {};
    this.locationSubscription = null;
    this.renderResult$ = new Subject();

    this.createNotFoundHandler = createNotFoundHandler;
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
    const forwardTransition$ = new Subject();
    const transitionFromLocation = (toLocation, redirectCount) => {
      const forward = (redirectUrl) => {
        if (redirectCount > 20) {
          throw new Error('To many redirects!');
        }

        this.history.replace(redirectUrl);

        const location = Object.assign(this.history.parseUrl(redirectUrl), { source: 'replace', state: {} });

        if (this.currentLocation.pathname === location.pathname && this.currentLocation.search === location.search) {
          if (this.currentLocation.hash === location.hash) {
            throw new Error('Redirect to the same location!');
          }
          this.activeRoute[2].hashChange(location);
          this.currentLocation = location;
        } else {
          this.currentLocation = location;

          forwardTransition$.onNext(
            transitionFromLocation(
              location,
              redirectCount + 1
            )
          );
        }
      };
      return {
        location: toLocation,
        router: this,
        redirectCount,
        // todo: redirect + forward
        forward,
      };
    };
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


    this.locationSubscription = Observable.merge(
      Observable.merge(
        historyTransition$,
        navigateTransition$
      )
        .map(location => transitionFromLocation(location, 0)),

      forwardTransition$
    )

    // transition handling
      .map(transition => {
        const { location } = transition;
        const queryData = parseQuery(location.search.substr(1));
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
      .flatMap(transition => {
        const loadRoute = (routes, index) => {
          if (index >= routes.length) {
            const notFoundHandler = this.createNotFoundHandler(transition);
            return notFoundHandler.load().then(() => [null, {}, notFoundHandler]);
          }

          const route = routes[index];
          const handler = this.createHandler(transition, route[0], route[1]);
          return handler.load().then(loadResult => (
            loadResult
              ? [route[0].name, route[1], handler]
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
    if (this.locationSubscription) {
      this.locationSubscription.dispose();
    }
  }

  renderResult() {
    if (!this.locationSubscription) {
      this.start();
    }
    return this.renderResult$;
  }

  isActive(route, params) {
    const activeRoute = this.activeRoute[0];
    if (activeRoute && activeRoute.substr(0, route.length) === route) {
      let active = true;
      const activeRouteParams = this.activeRoute[1];

      let paramName;
      for (paramName in params) {
        if (params.hasOwnProperty(paramName)) {
          active = active
            && (`${params[paramName]}` === `${activeRouteParams[paramName]}`);
        }
      }
      return active;
    }
    return false;
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
