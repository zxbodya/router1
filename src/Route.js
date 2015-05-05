'use strict';

const {
  BehaviorSubject,
  Observable
  } = require('rx');

const generatorFromExpression = require('./generatorFromExpression');
const matcherFromExpression = require('./matcherFromExpression');
const PartialRoute = require('./PartialRoute');

let contactExpressions = require('./concatExpressions');


class Route {
  constructor(router, rawRoute) {
    this.router = router;
    this.rawRoute = rawRoute;

    let pathExp = contactExpressions(rawRoute.map(part=>part.path));

    let searchParams = [];
    rawRoute.forEach(part=> {
      searchParams.push(...part.searchParams);
    });

    let allParams = new Set([...pathExp[2], ...searchParams]);

    this.allParams = [...allParams.values()];
    this.name = rawRoute.map(part=>part.name).join('/');

    this.matchPath = matcherFromExpression(pathExp);
    this.generatePath = generatorFromExpression(pathExp);
  }

  handle(state, params, search/*, hash*/) {
    let newState = {};

    let paramStreams = {};
    this.allParams.forEach(paramName=> {
      let prevStreams = state && state.paramStreams && state.paramStreams[paramName];
      if (prevStreams) {
        paramStreams[paramName] = prevStreams;
        prevStreams[0].onNext(params[paramName] || search[paramName] || '');
      } else {
        let paramValue = new BehaviorSubject(params[paramName] || search[paramName] || '');
        paramStreams[paramName] = [paramValue, paramValue.distinctUntilChanged()];
      }
    });

    newState.paramStreams = paramStreams;

    let elementStreams = {};
    let prevChanged = false;
    let partStates = new Array(this.rawRoute.length);
    const viewByKey = slotKey => results=> {
      if (!results[slotKey]) {
        //todo :
        console.log('warning missing view ' + slotKey);
        return Observable.return(null);
      }
      return results[slotKey];
    };

    for (let i = this.rawRoute.length - 1; i >= 0; i--) {
      let part = this.rawRoute[i];

      let partState;

      if (state && state.parts && state.parts.length > i) {
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
          elementStreams = partState.es;
          continue;
        }
      }
      // changed
      prevChanged = true;
      partState = {part};

      let publicParamStreams = {};
      for (let key in paramStreams) {
        if (paramStreams.hasOwnProperty(key)) {
          publicParamStreams[key] = paramStreams[key][1];
        }
      }
      var route = new PartialRoute(this, this.rawRoute, i);

      let ess = new BehaviorSubject(elementStreams);
      let es = {};
      for (let slotIndex = 0, l = part.slots.length; slotIndex < l; slotIndex++) {
        let slotKey = part.slots[slotIndex];
        es[slotKey] = ess.switchMap(viewByKey(slotKey));
      }
      partState.ess = ess;
      elementStreams = part.handler(route, publicParamStreams, es);
      partState.es = elementStreams;
      partStates[i] = partState;
    }
    newState.parts = partStates;
    return [newState, elementStreams];
  }

  isActive(route, params, parents) {
    return this.router.isActive(route, params, parents);
  }

  url(route, params) {
    return this.router.url(route, params);
  }

  absUrl(route, params) {
    return this.router.absUrl(route, params);
  }

  navigate(route, params, replace) {
    this.router.navigate(route, params, replace);
  }
}

module.exports = Route;
