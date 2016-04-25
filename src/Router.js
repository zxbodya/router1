import compileRoutes from './compileRoutes';
import { Subject } from 'rx';
import { parse as parseQuery, generate as generateQuery } from './utils/queryString';

class Router {
  constructor({ history, routes, render }) {
    this.history = history;
    this.routes = [];
    this.render = render;

    this.routesByName = {};
    this.addRoutes(routes);

    this.activeRoute = [null, {}];

    this.hashChange = new Subject();
    this.currentLocation = {};
  }

  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route => {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  matchRoute(location) {
    const { pathname, search } = location;
    const matched = [];

    for (let i = 0, l = this.routes.length; i < l; i++) {
      const route = this.routes[i];
      const params = route.matchPath(pathname);
      if (params) {
        matched.push([route, params]);
      }
    }

    if (matched.length === 0) {
      return { route: null, handlers: [], params: {}, location };
    }
    const res = matched[0];


    // todo: conflict clause
    if (matched.length > 1) {
      console.log('matched few routes');
    }
    // 1.  warning in dev mode
    // 2.  optional data resolving step
    // 2.1 select from conflicting

    const route = res[0];
    const params = res[1];

    const searchParams = parseQuery(search.substr(1), route.searchParams);

    return { route: route.name, handlers: route.handlers, params: Object.assign(params, searchParams), location };
  }

  renderResult() {
    return this.history
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
      .map(this.matchRoute.bind(this))
      .do(({ route, params }) => {
        this.activeRoute = [route, params];
      })
      .flatMapLatest(this.render)
      .share();
  }

  isActive(route, params) {
    if (this.activeRoute[0] && this.activeRoute[0].substr(0, route.length) === route) {
      let active = true;

      let paramName;
      for (paramName in params) {
        if (params.hasOwnProperty(paramName)) {
          active = active
            && ('' + params[paramName]) === ('' + this.activeRoute[1][paramName]);
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
    console.error(`Route "${name}" not found`);
    return `#route-${name}-not-found`;
  }

  navigate(route, params = {}, hash = '', state = {}) {
    const url = this.createUrl(route, params, hash);
    this.history.push(url, state);
  }

  navigateToUrl(url, state = {}) {
    this.history.push(url, state);
  }

}

export default Router;
