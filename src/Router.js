import { compileRoutes } from './compileRoutes';
import { Subject } from 'rx';
import {
  parse as parseQuery,
  generate as generateQuery,
  pickValues as pickQueryValues,
} from './utils/queryString';

export class Router {
  constructor({ history, routes, render }) {
    this.history = history;
    this.routes = [];
    this.render = render;

    this.routesByName = {};
    this.addRoutes(routes);

    this.activeRoute = [null, {}, null];

    this.currentLocation = {};
    this.locationSubscription = null;

    this.hashChange = new Subject();
    this.renderResult$ = new Subject();
  }

  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route => {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  createNotFoundHandler(routingResult) {
    return {
      load: () => Promise.resolve(true),
      hashChange: (v) => {
        this.hashChange.onNext(v);
      },
      beforeLeave: () => '',
      render: () => {
        const { location } = routingResult;

        return this.render({
          route: null,
          handlers: [],
          params: {},
          location,
        });
      },
    };
  }

  createHandler(routingResult, route, params) {
    return {
      load: () => Promise.resolve(true),
      hashChange: (v) => {
        this.hashChange.onNext(v);
      },
      beforeLeave: () => '',
      render: () => {
        const { location } = routingResult;

        return this.render({
          route: route.name,
          handlers: route.handlers,
          params,
          location,
        });
      },
    };
  }

  start() {
    this.locationSubscription = this.history
      .location
      .filter(location => {
        let needUpdate = true;
        if (this.currentLocation.pathname === location.pathname && this.currentLocation.search === location.search) {
          this.hashChange.onNext(location);
          needUpdate = false;
        }
        this.currentLocation = location;
        return needUpdate;
      })
      // create transition object
      .map(location => ({ location }))
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
            return Promise.resolve([null, {}, this.createNotFoundHandler(transition)]);
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
      return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
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
    this.history.push(url, state);
  }

}
