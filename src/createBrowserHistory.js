import { Observable, Subject } from 'rx';

export function createBrowserHistory() {
  function currentLocation(source) {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      source,
      state: window.history.state || {},
    };
  }

  const changes = new Subject();
  const next = (source) => {
    changes.onNext(currentLocation(source));
  };

  let location;
  let push;
  let replace;

  if ('onpopstate' in window) {
    location = Observable
      .fromEvent(window, 'popstate')
      .map(() => currentLocation('pop'))
      .startWith(currentLocation('init'))
      .merge(changes)
      .shareReplay(1);

    push = (url, state = null, title = null) => {
      window.history.pushState(state, title, url);
      next('push');
    };
    replace = (url, state = null, title = null) => {
      window.history.replaceState(state, title, url);
      next('replace');
    };
  } else {
    replace = (url) => {
      window.location.replace(url);
      next('replace');
    };
    push = (url) => {
      window.location.assign(url);
      next('push');
    };
    location = Observable
      .return(currentLocation('init'))
      .merge(changes)
      .shareReplay(1);
  }

  return {
    push,
    replace,
    location,
  };
}
