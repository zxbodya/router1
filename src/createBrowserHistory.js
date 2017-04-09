import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/publishReplay';

import { locationFromUrl } from './utils/locationFromUrl';

export function createBrowserHistory() {
  function currentLocation(source) {
    return {
      pathname: window.location.pathname,
      search: window.location.search && window.location.search.substr(1),
      hash: window.location.hash && window.location.hash.substr(1),
      source,
      state: window.history.state || {},
    };
  }

  let location;
  let push;
  let replace;

  if ('onpopstate' in window) {
    location = Observable.fromEvent(window, 'popstate')
      .map(() => currentLocation('pop'))
      .startWith(currentLocation('init'))
      .publishReplay(1)
      .refCount();

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
    location = Observable.of(currentLocation('init'))
      .publishReplay(1)
      .refCount();
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
