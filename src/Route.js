import {BehaviorSubject, Observable} from 'rx';

import generatorFromExpression from './expressions/createGenerator';
import matcherFromExpression from './expressions/createMatcher';

let contactExpressions = require('./expressions/concat');


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

    let view = null;
    let prevChanged = false;
    let partStates = new Array(this.rawRoute.length);

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
            partState.ess.onNext(view);
          }
          prevChanged = false;
          partStates[i] = partState;
          view = partState.es;
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

      let ess;
      let es;

      if (view) {
        ess = new BehaviorSubject(view);
        es = ess.flatMapLatest(s=>s);
      }

      partState.ess = ess;
      view = this.router.getHandler(part.handler)(publicParamStreams, es);
      partState.es = view;
      partStates[i] = partState;
    }
    newState.parts = partStates;
    return [newState, view];
  }
}

export default Route;
