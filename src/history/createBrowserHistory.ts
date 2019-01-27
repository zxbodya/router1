import { fromEvent } from 'rxjs';
import { map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';
import { splitUrl } from '../utils/splitUrl';

import { History, Location, LocationSource } from './history';

export function createBrowserHistory({
  forceReload,
}: {
  forceReload?: boolean;
} = {}): History {
  function currentLocation(source?: LocationSource): Location {
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

  if ('onpopstate' in window && !forceReload) {
    location = fromEvent(window, 'popstate').pipe(
      map(() => currentLocation('pop')),
      startWith(currentLocation('init')),
      publishReplay(1),
      refCount()
    );

    push = (url: string, state?: object, title = '') => {
      window.history.pushState(state, title, url);
    };
    replace = (url: string, state?: object, title = '') => {
      window.history.replaceState(state, title, url);
    };
  } else {
    const justUpdateHash = (url: string) => {
      const [path, query, hash] = splitUrl(url);
      const cl = currentLocation();
      if (cl.pathname === path && cl.search === query) {
        window.location.hash = `#${hash}`;
        return true;
      }
      return false;
    };
    replace = (url: string) => {
      if (!justUpdateHash(url)) {
        window.location.replace(url);
      }
    };
    push = (url: string) => {
      if (!justUpdateHash(url)) {
        window.location.assign(url);
      }
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
