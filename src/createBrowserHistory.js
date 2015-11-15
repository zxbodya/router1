import {Observable, Subject} from 'rx';

function historyFactory() {
  function currentLocation() {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    };
  }

  const changes = new Subject();
  const next = ()=> {
    changes.onNext(currentLocation());
  };
  if ('onpopstate' in window) {
    return {
      push(url, data = null, title = null){
        window.history.pushState(data, title, url);
        next();
      },
      replace(url, data = null, title = null){
        window.history.replaceState(data, title, url);
        next();
      },
      location: Observable
        .fromEvent(window, 'popstate')
        .map(()=>currentLocation())
        .startWith(currentLocation())
        .merge(changes)
        .shareReplay()
    }
  } else {
    return {
      push(url){
        window.location.assign(url);
        next();
      },
      replace(url){
        window.location.replace(url);
        next();
      },
      location: Observable
        .return(currentLocation())
        .merge(changes)
        .shareReplay()
    };
  }
}

export default historyFactory;
