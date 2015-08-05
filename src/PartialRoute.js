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
}

export default PartialRoute;
