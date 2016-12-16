import { Observable } from 'rxjs';
import { locationFromUrl } from './utils/locationFromUrl';

export function createServerHistory(initialUrl) {
  return {
    createUrl(pathname, search, hash) {
      return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
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
    location: Observable.of(
        Object.assign(locationFromUrl(initialUrl), { source: 'init' })
      )
      .publishReplay(1)
      .refCount(),
  };
}
