import { Subject } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

export function createTestHistory(initialUrl, cb) {
  const location$ = new Subject();
  return {
    push(url, state = null, title = null) {
      if (cb) cb('push', { url, state, title });
    },
    replace(url, state = null, title = null) {
      if (cb) cb('replace', { url, state, title });
    },
    location: location$
      .startWith(
        locationFromUrl(initialUrl)
      )
      .shareReplay(),
  };
}
