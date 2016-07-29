import { compileRoutes } from './compileRoutes';
import {
  pickValues as pickQueryValues,
} from './utils/queryString';

export class RouteCollection {
  constructor(routes) {
    this.routes = [];
    this.routesByName = {};
    this.addRoutes(routes);
  }

  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route => {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  match(pathname, queryData) {
    const matched = [];

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
    return matched;
  }

  getByName(name) {
    return this.routesByName[name];
  }
}
