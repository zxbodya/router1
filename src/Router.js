import { compileRoutes } from './compileRoutes';
import { Subject } from 'rx';
import {
  parse as parseQuery,
  generate as generateQuery,
  pickValues as pickQueryValues,
} from './utils/queryString';

function resolveConflict(matchedRoutes, location) {
  if (process.env.NODE_ENV !== 'production') {
    // todo: make decision about best way to handle this case
    //  - always use first and do not warn about conflicts
    //  - allow to override match selection
    //  - something else?
    if (matchedRoutes.length > 1) {
      console.warn([
        'matched few routes (using first matched route)',
        ` location: ${JSON.stringify(location)}`,
        ' routes: ',
        ...matchedRoutes.map(([route, params]) =>
          ` - ${route.name}(${JSON.stringify(params)})`
        )].join('\n')
      );
    }
  }

  return matchedRoutes[0];
}

export class Router {
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
    const { pathname } = location;
    const search = location.search.substr(1);
    const matched = [];
    const queryData = parseQuery(search);

    for (let i = 0, l = this.routes.length; i < l; i++) {
      const route = this.routes[i];
      const params = route.matchPath(pathname);
      if (params) {
        matched.push([
          route,
          Object.assign(
            params,
            pickQueryValues(queryData, route.searchParams)
          )]);
      }
    }

    if (matched.length === 0) {
      return { route: null, handlers: [], params: {}, location };
    }

    const [route, params] = resolveConflict(matched, location);

    return {
      route: route.name,
      handlers: route.handlers,
      params,
      location,
    };
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
