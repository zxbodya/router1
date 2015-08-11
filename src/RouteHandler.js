import Rx, {BehaviorSubject, Observable} from 'rx';

class RouteHandler {
  constructor(getHandler) {
    this.getHandler = getHandler;
    this.state = {};
  }

  handle(route, params, search) {

    let state = this.state;

    let newState = {};

    let paramStreams = {};
    route.allParams.forEach(paramName=> {
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
    let partStates = new Array(route.handler.length);

    for (let i = route.handler.length - 1; i >= 0; i--) {
      let part = route.handler[i];

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
      view = this.getHandler(part)(publicParamStreams, es);
      partState.es = view;
      partStates[i] = partState;
    }
    newState.parts = partStates;
    this.state = newState;
    return view;
  }
}

export default RouteHandler;
