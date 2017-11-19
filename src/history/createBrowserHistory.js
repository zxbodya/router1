import { fromEvent } from 'rxjs/observable/fromEvent';
import { of } from 'rxjs/observable/of';

import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { publishReplay } from 'rxjs/operators/publishReplay';
import { refCount } from 'rxjs/operators/refCount';

import { locationFromUrl } from '../utils/locationFromUrl';

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
    location = fromEvent(window, 'popstate').pipe(
      map(() => currentLocation('pop')),
      startWith(currentLocation('init')),
      publishReplay(1),
      refCount()
    );

    push = (url, state = null, title = null) => {
      window.history.pushState(state, title, url);
    };
    replace = (url, state = null, title = null) => {
      window.history.replaceState(state, title, url);
    };
  } else {
    // todo: do not reassign location when only hash changed
    replace = url => {
      window.location.replace(url);
    };
    push = url => {
      window.location.assign(url);
    };
    // todo: on hashchange
    location = of(currentLocation('init')).pipe(publishReplay(1), refCount());
  }

  return {
    createUrl(path, search, hash) {
      return `${path}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url) {
      return locationFromUrl(url);
    },
    push,
    replace,
    location,
  };
}