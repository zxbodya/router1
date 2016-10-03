import { Observable } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

import { splitUrl } from './utils/splitUrl';

export function createHashHistory() {
  function currentLocation(source) {
    const parts = splitUrl(window.location.hash && window.location.hash.substr(1));
    return {
      pathname: parts[0] || '/',
      search: parts[1] && `${parts[1]}`,
      hash: parts[2] && `${parts[2]}`,
      source,
      state: (window.history && window.history.state) || {},
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
    replace = (url) => {
      window.location.replace(url);
    };
    push = (url) => {
      window.location.assign(url);
    };

    location = Observable.fromEvent(window, 'hashchange')
      .map(() => currentLocation('pop'))
      .startWith(currentLocation('init'))
      .shareReplay(1);
  }

  return {
    createUrl(pathname, search, hash) {
      return `#${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url) {
      const parts = splitUrl(url);
      return locationFromUrl(parts[2]);
    },
    push,
    replace,
    location,
  };
}