import { compileRoutes } from './compileRoutes';
import { pickValues as pickQueryValues } from './utils/queryString';

import { Route, RouteDef } from './compileRoutes';
import { RouteParams } from './Router';

export class RouteCollection<RouteHandler> {
  private readonly routes: Array<Route<RouteHandler>>;

  private readonly routesByName: {
    [name: string]: Route<RouteHandler>;
  };

  constructor(routes: Array<RouteDef<RouteHandler>>) {
    this.routes = [];
    this.routesByName = {};
    this.addRoutes(routes);
  }

  public addRoutes(routeDefs: Array<RouteDef<RouteHandler>>): void {
    compileRoutes(routeDefs).forEach(route => {
      this.routes.push(route);
      this.routesByName[route.name] = route;
    });
  }

  public match(
    pathname: string,
    queryData: RouteParams
  ): Array<[Route<RouteHandler>, RouteParams]> {
    const matched = [] as Array<[Route<RouteHandler>, RouteParams]>;

    for (let i = 0, l = this.routes.length; i < l; i += 1) {
      const route = this.routes[i];
      const params = route.matchPath(pathname);
      if (params) {
        matched.push([
          route,
          { ...params, ...pickQueryValues(queryData, route.searchParams) },
        ]);
      }
    }
    return matched;
  }

  public getByName(name: string): Route<RouteHandler> {
    return this.routesByName[name];
  }
}
