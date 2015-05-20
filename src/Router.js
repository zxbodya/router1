'use strict';

const Rx = require('rx');
const compileRoutes = require('./compileRoutes');
const Route = require('./Route');
const splitUrl = require('./splitUrl');

class Router extends Rx.AnonymousSubject {
  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(compiledRoute=> {
        let route = new Route(this, compiledRoute);
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  constructor(locationObservable, routeDefs, getHandler) {
    let state = state;
    let router;
    const routingResult = locationObservable
      .map(locationChange=> {
        let [location, scroll] = locationChange;
        let urlParts = splitUrl(location || '');

        let path = urlParts[0];
        let search = {};
        let hash = urlParts[2];

        location = {path, search, hash};

        let matched = [];

        for (let i = 0, l = routes.length; i < l; i++) {
          let route = routes[i];
          let params = route.matchPath(path);
          if (params) {
            matched.push([route, params]);
          }
        }

        let res;
        if (matched.length === 0) {
          //todo: route not found clause
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

        let route = res[0];
        let params = res[1];
        router.activeRoute = [route.name, params];

        let handleResult = route.handle(state, params, location.search, location.hash);
        state = handleResult[0];
        return [handleResult[1], scroll, location.hash];
      });

    let navigate = Rx.Observer.create(function (args) {
      this.navigate(...args);
    });

    super(navigate, routingResult);
    router = this;
    this.getHandler = getHandler;

    var routes = this.routes = [];
    this.routesByName = {};
    this.state = {};
    this.location = locationObservable;
    this.activeRoute = [null, {}];

    this.addRoutes(routeDefs);
  }

  isActive(route, params, parents) {
    // todo: move to lower levels
    if (
      this.activeRoute[0]
      && (
        (parents && route === this.activeRoute[0].substring(0, route.length))
        || route === this.activeRoute[0]
      )
    ) {
      let active = true;

      for (let paramName in params)
        if (params.hasOwnProperty(paramName)) {
          active = active && params[paramName].toString() === this.activeRoute[1][paramName].toString();
        }
      return active;
    }
    return false;
  }

  url(name, params = {}, hash = '') {
    let route = this.routesByName[name];
    if (route) {
      var generatePath = route.generatePath(Object.assign({}, this.activeRoute[1], params));
    } else {
      throw new Error(`Route "${name}" not found`);
    }
    let url = generatePath;
    if (hash) {
      url += '#' + hash;
    }
    return url;
  }

  navigate(route, params = {}, hash = '') {
    let url = this.url(route, params, hash);
    this.location.onNext(url);
  }

  navigateToUrl(url) {
    this.location.onNext(url);
  }
}

module.exports = Router;
