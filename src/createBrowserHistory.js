import {Observable, Subject} from 'rx';

function historyFactory() {
  function currentLocation(source) {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      source,
    };
  }

  const changes = new Subject();
  const next = (source)=> {
    changes.onNext(currentLocation(source));
  };

  let location;
  let push;
  let replace;

  if ('onpopstate' in window) {
    location = Observable
      .fromEvent(window, 'popstate')
      .map(()=>currentLocation('pop'))
      .startWith(currentLocation('init'))
      .merge(changes)
      .shareReplay();

    push = (url, data = null, title = null)=> {
      window.history.pushState(data, title, url);
      next('push');
    };
    replace = (url, data = null, title = null)=> {
      window.history.replaceState(data, title, url);
      next('replace');
    };
  } else {
    replace = (url)=> {
      window.location.replace(url);
      next('push');
    };
    push = (url)=> {
      window.location.assign(url);
      next('replace');
    };
    location = Observable
      .return(currentLocation('init'))
      .merge(changes)
      .shareReplay();
  }

  return {
    push,
    replace,
    location,
  };
}

export default historyFactory;
