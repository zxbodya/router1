const Rx = require('rx');

const generatorFromExpression = require('./generatorFromExpression');
const matcherFromExpression = require('./matcherFromExpression');

let contactExpressions = (expressions)=> {
  let exp = '';
  let params = [];
  let parts = [];

  for (let i = 0, l = expressions.length; i < l; i++) {
    let partPath = expressions[i];
    exp += partPath[0];
    parts = parts.concat(partPath[1]);
    params = params.concat(partPath[2]);
  }
  return [exp, parts, params]
};


class Route {
  constructor(router, rawRoute) {
    this._router = router;
    this._rawRoute = rawRoute;

    let pathExp = contactExpressions(rawRoute.map(part=>part.path));
    let hashExp = contactExpressions(rawRoute.map(part=>part.hash));

    let searchParams = [];
    rawRoute.forEach(part=> {
      searchParams.push(...part.searchParams);
    });

    let allParams = new Set([...pathExp[2], ...hashExp[2], ...searchParams]);

    this._allParams = [...allParams.values()];

    this.name = rawRoute.map(part=>part.name).join('/');

    this.matchPath = matcherFromExpression(pathExp);
    this.matchHash = matcherFromExpression(hashExp);

    this.generatePath = generatorFromExpression(pathExp);
    this.generateHash = generatorFromExpression(hashExp);
  }


  handle(state, params, search, hash) {
    let newState;

    let paramStreams = {};
    this._allParams.forEach(paramName=> {
      let paramValue = new Rx.ReplaySubject(1);
      paramValue.onNext(params[paramName] || search[paramName] || '');
      paramStreams[paramName] = [paramValue, paramValue.distinctUntilChanged()];
    });

    let elementStreams = {};
    for (let i = this._rawRoute.length - 1; i >= 0; i--) {
      let part = this._rawRoute[i];
      let publicParamStreams = {};
      Object.keys(paramStreams).forEach(key=> {
        publicParamStreams[key] = paramStreams[key][1];
      });
      elementStreams = part.handler(this, publicParamStreams, elementStreams)
    }
    return [newState, elementStreams];
  }

  isActive(route, params, parents) {
    this._router.isActive(route, params, parents);
  }

  url(route, params) {
    this._router.url(route, params);
  }

  absUrl(route, params) {
    this._router.absUrl(route, params);
  }

  navigate(route, params, replace) {
    this._router.navigate(route, params, replace);
  }
}

module.exports = Route;
