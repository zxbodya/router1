import { of } from 'rxjs';

import { publishReplay, refCount } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

import { History, Location } from './history';

export function createServerHistory(initialUrl: string): History {
  return {
    createUrl(path, search, hash) {
      return `${path}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url) {
      return locationFromUrl(url);
    },
    push() {
      throw new Error('navigation not supported');
    },
    replace() {
      throw new Error('navigation not supported');
    },
    location: of<Location>({
      ...locationFromUrl(initialUrl),
      source: 'init',
    }).pipe(
      publishReplay(1),
      refCount()
    ),
  };
}
