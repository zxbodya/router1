import { Subject } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

export function createTestHistory(initialUrl, cb) {
  const location$ = new Subject();
  return {
    createUrl(pathname, search, hash) {
      return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
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
      location$.onNext(
        Object.assign(locationFromUrl(url, state), { source: 'pop' })
      );
    },
    location: location$
      .startWith(
        Object.assign(locationFromUrl(initialUrl), { source: 'init' })
      )
      .shareReplay(1),
  };
}
