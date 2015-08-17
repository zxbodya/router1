import Rx, {BehaviorSubject, Observable} from 'rx';
import NotFound from './../views/NotFound.js';
import RxComponent from '../utils/RxComponent.js';

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

    let view = null, meta = null, status = null;
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
            partState.view$$.onNext(view);
            partState.meta$$.onNext(meta);
          }
          prevChanged = false;
          partStates[i] = partState;
          view = partState.view$;
          meta = partState.meta$;
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

      let view$$;
      let view$;

      if (view) {
        view$$ = new BehaviorSubject(view);
        view$ = view$$.flatMapLatest(s=>s);
      }

      let meta$$;
      let meta$;

      if (meta) {
        meta$$ = new BehaviorSubject(meta);
        meta$ = meta$$.flatMapLatest(s=>s);
      }

      partState.view$$ = view$$;
      partState.meta$$ = meta$$;
      let handleResult = this.getHandler(part)(publicParamStreams, view$);
      if (handleResult.subscribe) {
        view = handleResult;
        meta = meta$;
      } else {
        view = handleResult.view;
        meta = handleResult.meta;
        status = handleResult.status;
      }
      partState.view$ = view;
      partState.meta$ = meta;
      partStates[i] = partState;
    }
    newState.parts = partStates;
    this.state = newState;
    if (!meta) {
      meta = Observable.just({});
    }
    if (!status) {
      status = Observable.just({code: 200});
    }
    return {view, meta, status};
  }

  notFound() {
    this.state = {};
    return {
      view: new RxComponent(NotFound),
      status: Observable.just({code: 404}),
      meta: Observable.just({title: 'Страница не найдена'})
    };
  }
}

export default RouteHandler;
