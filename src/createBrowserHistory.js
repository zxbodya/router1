import {Observable} from 'rx';

function historyFactory() {
  function currentLocation() {
    return {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    };
  }

  if ('onpopstate' in window) {
    return {
      push(url, data = null, title = null){
        window.history.pushState(data, title, url);
      },
      replace(url, data = null, title = null){
        window.history.replaceState(data, title, url);
      },
      location: Observable
        .fromEvent(window, 'popstate')
        .map(()=>currentLocation())
        .startWith(currentLocation())
        .shareReplay()
    }
  } else {
    return {
      push(url){
        window.location.assign(url);
      },
      replace(url){
        window.location.replace(url);
      },
      location: Observable
        .return(currentLocation())
        .shareReplay()
    };
  }
}

export default historyFactory;
