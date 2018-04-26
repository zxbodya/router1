import { Subject } from 'rxjs';
import { startWith, publishReplay, refCount } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

export function createTestHistory(initialUrl, cb) {
  const location$ = new Subject();
  return {
    createUrl(path, search, hash) {
      return `${path}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url) {
      return locationFromUrl(url);
    },
    push(url, state = null, title = null) {
      if (cb) cb('push', { url, state, title });
    },
    replace(url, state = null, title = null) {
      if (cb) cb('replace', { url, state, title });
    },
    navigate(url, state) {
      location$.next({ ...locationFromUrl(url, state), source: 'pop' });
    },
    location: location$.pipe(
      startWith({ ...locationFromUrl(initialUrl), source: 'init' }),
      publishReplay(1),
      refCount()
    ),
  };
}
