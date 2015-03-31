'use strict';

const Rx = require('rx');
const compileRoutes = require('./compileRoutes');
const Route = require('./Route');

class Router extends Rx.AnonymousSubject {
  addRoutes(routeDefs) {
    compileRoutes(routeDefs).map(
        compiledRoute=>new Route(this, compiledRoute)
    ).forEach(route=> {
        this._routes.push(route);
        this._routesByName[route.name] = route;
      })
  }

  constructor(location, routeDefs) {
    var routes = this._routes = [];
    this._routesByName = {};
    this._state = {};
    this.addRoutes(routeDefs);

    this._location = location;
    this._activeRoute = [null, {}];
    let state = state;
    const routingResult = location
      .map((location)=> {
        let path = location;
        let search = {};
        let hash = '';

        location = {path, search, hash};

        let matched = [];

        for (let i = 0, l = routes.length; i < l; i++) {
          let route = routes[i];
          let params = route.matchPath(path);
          if (params) {
            matched.push([route, params]);
          }
        }

        return [matched, location];
      })
      .map(data=> {
        let [matched,location] = data;
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
        return [res, location];
      })
      .map(match=> {
        let route = match[0][0];
        let params = match[0][1];
        this._activeRoute = [route.name, params];
        let location = match[1];

        let res = route.handle(state, params, location.search, location.hash);
        state = res[0];
        return res[1];
      });

    let navigate = Rx.Observer.create(function (args) {
      this.navigate(...args);
    });

    super(navigate, routingResult)
  }

  isActive(route, params, parents) {
    // todo: move to lower levels
    if (
      this._activeRoute[0]
      && (
      (parents && route === this._activeRoute[0].substring(0, route.length))
      || route === this._activeRoute[0]
      )
    ) {
      let active = true;

      for (let paramName in params)
        if (params.hasOwnProperty(paramName)) {
          active = active && params[paramName].toString() === this._activeRoute[1][paramName].toString()
        }
      return active;
    }
    return false;
  }

  url(route, params) {
    route = this._routesByName[route];
    //todo: throw for not existing route
    //todo: throw for abstract routes
    let paramsWithDefaults = Object.assign({}, this._activeRoute[1], params);
    return route.generatePath(paramsWithDefaults);
  }

  absUrl(route, params) {
    //todo:
    return this.url(route, params);
  }

  navigate(route, params, replace) {
    let url = this.url(route, params);
    this._location.onNext(url);
  }
}

module.exports = Router;
