import { of } from 'rxjs';

import { publishReplay, refCount } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

export function createServerHistory(initialUrl) {
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
    location: of({ ...locationFromUrl(initialUrl), source: 'init' }).pipe(
      publishReplay(1),
      refCount()
    ),
  };
}
