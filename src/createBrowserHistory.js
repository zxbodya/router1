import { Observable } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

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

  let location;
  let push;
  let replace;

  if ('onpopstate' in window) {
    location = Observable
      .fromEvent(window, 'popstate')
      .map(() => currentLocation('pop'))
      .startWith(currentLocation('init'))
      .shareReplay(1);

    push = (url, state = null, title = null) => {
      window.history.pushState(state, title, url);
    };
    replace = (url, state = null, title = null) => {
      window.history.replaceState(state, title, url);
    };
  } else {
    // todo: do not reassign location when only hash changed
    replace = (url) => {
      window.location.replace(url);
    };
    push = (url) => {
      window.location.assign(url);
    };
    // todo: on hashchange
    location = Observable
      .return(currentLocation('init'))
      .shareReplay(1);
  }

  return {
    createUrl(pathname, search, hash) {
      return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url) {
      return locationFromUrl(url);
    },
    push,
    replace,
    location,
  };
}
