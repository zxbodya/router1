import { fromEvent } from 'rxjs';
import { map, publishReplay, refCount, startWith } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

import { splitUrl } from '../utils/splitUrl';

import { History, Location, LocationSource } from './history';

export function createHashHistory(): History {
  function currentLocation(source: LocationSource): Location {
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

    push = (url: string, state: object | null = null, title: string = '') => {
      window.history.pushState(state, title, url);
    };
    replace = (
      url: string,
      state: object | null = null,
      title: string = ''
    ) => {
      window.history.replaceState(state, title, url);
    };
  } else {
    replace = (url: string) => {
      window.location.replace(url);
    };
    push = (url: string) => {
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
    createUrl(path, search, hash): string {
      const url = `#${path}${search ? `?${search}` : ''}${
        hash ? `#${hash}` : ''
      }`;
      return url === '#/' ? '' : url;
    },
    parseUrl(url: string): Location {
      const parts = splitUrl(url);
      return locationFromUrl(parts[2] || '/');
    },
    push,
    replace,
    location,
  };
}
