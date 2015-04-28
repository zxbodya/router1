'use strict';
class PartialRoute {
  /**
   *
   * @param {Route} route
   * @param rawRoute
   * @param index
   */
  constructor(route, rawRoute, index) {
    this.route = route;
    this.resolveRoute = (path)=> {
      if (path[0] === '/') {
        return path.slice(1);
      }
      let result = rawRoute.slice(0, index + 1).map(partialRoute=>partialRoute.name).join('/');
      if (path === '') {
        return result;
      } else {
        return result + '/' + path;
      }
    };
  }

  //------- User api --------//

  isActive(route, params = {}, parents = true) {
    return this.route.isActive(this.resolveRoute(route), params, parents);
  }

  url(route, params = {}) {
    return this.route.url(this.resolveRoute(route), params);
  }

  absUrl(route, params = {}) {
    return this.route.absUrl(this.resolveRoute(route), params);
  }

  navigate(route, params = {}, replace = false) {
    return this.route.navigate(this.resolveRoute(route), params, replace);
  }
}


module.exports = PartialRoute;
