import { compileRoutes } from './compileRoutes';
import { pickValues as pickQueryValues } from './utils/queryString';

import { CompiledRouteDef, RouteDef } from './compileRoutes';
import { RouteParams } from './Router';

export class RouteCollection<HandlerPart> {
  public routes: Array<CompiledRouteDef<HandlerPart>>;

  public routesByName: { [name: string]: CompiledRouteDef<HandlerPart> };

  constructor(routes: Array<RouteDef<HandlerPart>>) {
    this.routes = [];
    this.routesByName = {};
    this.addRoutes(routes);
  }

  public addRoutes(routeDefs: Array<RouteDef<HandlerPart>>): void {
    compileRoutes(routeDefs).forEach(route => {
      this.routes.push(route);
      this.routesByName[route.name] = route;
    });
  }

  public match(
    pathname: string,
    queryData: RouteParams
  ): Array<[CompiledRouteDef<HandlerPart>, RouteParams]> {
    const matched = [] as Array<[CompiledRouteDef<HandlerPart>, RouteParams]>;

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

  public getByName(name: string): CompiledRouteDef<HandlerPart> {
    return this.routesByName[name];
  }
}
