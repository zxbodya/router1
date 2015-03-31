'use strict';

const Rx = require('rx');

const generatorFromExpression = require('./generatorFromExpression');
const matcherFromExpression = require('./matcherFromExpression');
const PartialRoute = require('./PartialRoute');

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

    let searchParams = [];
    rawRoute.forEach(part=> {
      searchParams.push(...part.searchParams);
    });

    let allParams = new Set([...pathExp[2], ...searchParams]);

    this._allParams = [...allParams.values()];
    this.name = rawRoute.map(part=>part.name).join('/');

    this.matchPath = matcherFromExpression(pathExp);
    this.generatePath = generatorFromExpression(pathExp);
  }


  handle(state, params, search, hash) {
    let newState = {};

    let paramStreams = {};
    this._allParams.forEach(paramName=> {
      let prevStreams;
      if (prevStreams = state && state.paramStreams && state.paramStreams[paramName]) {
        paramStreams[paramName] = prevStreams;
        prevStreams[0].onNext(params[paramName] || search[paramName] || '');
      } else {
        let paramValue = new Rx.BehaviorSubject(params[paramName] || search[paramName] || '');
        paramStreams[paramName] = [paramValue, paramValue.distinctUntilChanged()];
      }
    });

    newState.paramStreams = paramStreams;

    let elementStreams = {};
    let prevChanged = false;
    let partStates = new Array(this._rawRoute.length);
    for (let i = this._rawRoute.length - 1; i >= 0; i--) {
      let part = this._rawRoute[i];

      let partState;

      if (state && state.parts && state.parts.length >= i) {
        let prev = state.parts[i];

        if (prev.part === part) {
          // changed previous (need to update element streams stream)
          // not changed
          partState = prev;
          if (prevChanged) {
            partState.ess.onNext(elementStreams);
          }
          prevChanged = false;
          partStates[i] = partState;
          continue;
        }
      }
      // changed
      prevChanged = true;
      partState = {part};

      let publicParamStreams = {};
      Object.keys(paramStreams).forEach(key=> {
        publicParamStreams[key] = paramStreams[key][1];
      });
      var route = new PartialRoute(this, this._rawRoute, i);

      let ess = new Rx.BehaviorSubject(elementStreams);
      let es = {};
      part.slots.forEach(slotKey=> {
        es[slotKey] = ess.switchMap(es=> {
          if (!es[slotKey]) {
            //todo :
            console.log('warning missing view ' + slotKey);
            return Rx.Observable.return(null);
          }
          return es[slotKey];
        });
      });
      partState.ess = ess;
      elementStreams = part.handler(route, publicParamStreams, es);

      partStates[i] = partState;
    }
    newState.parts = partStates;
    return [newState, elementStreams];
  }

  isActive(route, params, parents) {
    return this._router.isActive(route, params, parents);
  }

  url(route, params) {
    return this._router.url(route, params);
  }

  absUrl(route, params) {
    return this._router.absUrl(route, params);
  }

  navigate(route, params, replace) {
    this._router.navigate(route, params, replace);
  }
}

module.exports = Route;
