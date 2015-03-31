'use strict';
class PartialRoute {
  /**
   *
   * @param {Route} route
   * @param rawRoute
   * @param index
   */
  constructor(route, rawRoute, index) {
    this._route = route;
    this._resolveRoute = (path)=> {
      if (path[0] === '/') {
        return path.slice(1);
      }
      let result = rawRoute.slice(0, index + 1).map(route=>route.name).join('/');
      if (path === '') {
        return result;
      } else {
        return result + '/' + path;
      }
    }
  }

  //------- User api --------//

  isActive(route, params = {}, parents = true) {
    return this._route.isActive(this._resolveRoute(route), params, parents)
  }

  url(route, params = {}) {
    return this._route.url(this._resolveRoute(route), params)
  }

  absUrl(route, params = {}) {
    return this._route.absUrl(this._resolveRoute(route), params)
  }

  navigate(route, params = {}, replace = false) {
    return this._route.navigate(this._resolveRoute(route), params, replace)
  }
}


module.exports = PartialRoute;
