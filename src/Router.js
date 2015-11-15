import compileRoutes from './compileRoutes';


class Router {
  constructor(history, routes) {
    this.history = history;

    this.routes = [];
    this.routesByName = {};

    this.activeRoute = [null, {}];
    this.addRoutes(routes);
  }

  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route=> {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  routingResult() {
    return this.history
      .location
      .map((location)=> {
        const {pathname} = location;
        const matched = [];

        for (let i = 0, l = this.routes.length; i < l; i++) {
          const route = this.routes[i];
          const params = route.matchPath(pathname);
          if (params) {
            matched.push([route, params]);
          }
        }

        let res;
        if (matched.length === 0) {
          // todo: route not found clause
          console.log('route not found');
        } else {
          res = matched[0];

          // todo: conflict clause
          if (matched.length > 1) {
            console.log('matched few routes');
          }
          // 1.  warning in dev mode
          // 2.  optional data resolving step
          // 2.1 select from conflicting
          // 2.2 resource not found clause
        }

        if (res) {
          const route = res[0];
          const params = res[1];

          return {route: route.name, handler: route.handler, params, location};
        }
        return {route: null, handler: null, params: {}, location};
      })
      .do(({route, params})=> {
        this.activeRoute = [route, params];
      })
      .shareReplay();
  }

  isActive(route, params) {
    if (this.activeRoute[0] && route === this.activeRoute[0]) {
      let active = true;

      let paramName;
      for (paramName in params) {
        if (params.hasOwnProperty(paramName)) {
          active = active && params[paramName].toString() === this.activeRoute[1][paramName].toString();
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
      return `${pathname}${hash ? `#${hash}` : ''}`;
    }
    console.error(`Route "${name}" not found`);
    return `#route-${name}-not-found`;
  }

  navigate(route, params = {}, hash = '') {
    const url = this.createUrl(route, params, hash);
    this.history.push(url);
  }

  navigateToUrl(url) {
    this.history.push(url);
  }

}

export default Router;
