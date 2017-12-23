import { fromEvent } from 'rxjs/observable/fromEvent';

import { startWith } from 'rxjs/operators/startWith';
import { map } from 'rxjs/operators/map';
import { publishReplay } from 'rxjs/operators/publishReplay';
import { refCount } from 'rxjs/operators/refCount';

import { locationFromUrl } from '../utils/locationFromUrl';

import { splitUrl } from '../utils/splitUrl';

export function createHashHistory() {
  function currentLocation(source) {
    const parts = splitUrl(
      window.location.hash && window.location.hash.substr(1)
    );
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
    replace = url => {
      window.location.replace(url);
    };
    push = url => {
      window.location.assign(url);
    };

    location = fromEvent(window, 'hashchange').pipe(
      map(() => currentLocation('pop')),
      startWith(currentLocation('init')),
      publishReplay(1),
      refCount()
    );
  }

  return {
    createUrl(path, search, hash) {
      const url = `#${path}${search ? `?${search}` : ''}${
        hash ? `#${hash}` : ''
      }`;
      return url === '#/' ? '' : url;
    },
    parseUrl(url) {
      const parts = splitUrl(url);
      return locationFromUrl(parts[2] || '/');
    },
    push,
    replace,
    location,
  };
}
