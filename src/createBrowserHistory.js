import {Observable, Subject} from 'rx';

function historyFactory() {
  function currentLocation() {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    };
  }

  const changes = new Subject();
  const next = ()=> {
    changes.onNext(currentLocation());
  };

  let location;
  let push;
  let replace;

  if ('onpopstate' in window) {
    location = Observable
      .fromEvent(window, 'popstate')
      .map(()=>currentLocation())
      .startWith(currentLocation())
      .merge(changes)
      .shareReplay();

    push = (url, data = null, title = null)=> {
      window.history.pushState(data, title, url);
      next();
    };
    replace = (url, data = null, title = null)=> {
      window.history.replaceState(data, title, url);
      next();
    };
  } else {
    replace = (url)=> {
      window.location.replace(url);
      next();
    };
    push = (url)=> {
      window.location.assign(url);
      next();
    };
    location = Observable
      .return(currentLocation())
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
