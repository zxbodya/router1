import Rx, {BehaviorSubject, Observable} from 'rx';
import compileRoutes from './compileRoutes';
import splitUrl from './utils/splitUrl';

class Router extends Rx.AnonymousSubject {
  addRoutes(routeDefs) {
    compileRoutes(routeDefs)
      .forEach(route=> {
        this.routes.push(route);
        this.routesByName[route.name] = route;
      });
  }

  constructor(locationSubject, routeDefs, getHandler) {
    let state = state;
    let router;
    const routingResult = locationSubject
      .map(locationChange=> {
        let [location, scroll] = locationChange;
        let urlParts = splitUrl(location || '');

        let path = urlParts[0];
        let search = {};
        let hash = urlParts[2];

        location = {path, search, hash};

        let matched = [];

        for (let i = 0, l = routes.length; i < l; i++) {
          let route = routes[i];
          let params = route.matchPath(path);
          if (params) {
            matched.push([route, params]);
          }
        }

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

        let route = res[0];
        let params = res[1];
        router.activeRoute = [route.name, params];

        let handleResult = this.handle(route, state, params, location.search, location.hash);
        state = handleResult[0];
        return [handleResult[1], scroll, location.hash];
      });

    let navigate = Rx.Observer.create(function (args) {
      this.navigate(...args);
    });

    super(navigate, routingResult);
    router = this;
    this.getHandler = getHandler;

    var routes = this.routes = [];
    this.routesByName = {};
    this.state = {};
    this.location = locationSubject;
    this.activeRoute = [null, {}];

    this.addRoutes(routeDefs);
  }

  handle(route, state, params, search/*, hash*/) {

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
    return [newState, view];
  }

  isActive(route, params, parents) {
    // todo: move to lower levels
    if (
      this.activeRoute[0]
      && (
        (parents && route === this.activeRoute[0].substring(0, route.length))
        || route === this.activeRoute[0]
      )
    ) {
      let active = true;

      for (let paramName in params)
        if (params.hasOwnProperty(paramName)) {
          active = active && params[paramName].toString() === this.activeRoute[1][paramName].toString();
        }
      return active;
    }
    return false;
  }

  url(name, params = {}, hash = '') {
    let route = this.routesByName[name];
    if (route) {
      var generatePath = route.generatePath(Object.assign({}, this.activeRoute[1], params));
    } else {
      throw new Error(`Route "${name}" not found`);
    }
    let url = generatePath;
    if (hash) {
      url += '#' + hash;
    }
    return url;
  }

  navigate(route, params = {}, hash = '') {
    let url = this.url(route, params, hash);
    this.location.onNext(url);
  }

  navigateToUrl(url) {
    this.location.onNext(url);
  }
}

export default Router;
