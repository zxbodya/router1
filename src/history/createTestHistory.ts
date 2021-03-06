import { Subject } from 'rxjs';
import { publishReplay, refCount, startWith } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

import { History, Location } from './history';

type Navigate = (url: string, state?: object) => void;
type TestCallback = (
  action: 'push' | 'replace',
  historyState: {
    url: string;
    state?: object | null;
    title?: string | null;
  }
) => void;

export function createTestHistory(
  initialUrl: string,
  cb?: TestCallback
): History & { navigate: Navigate } {
  const location$: Subject<Location> = new Subject();
  return {
    createUrl(path: string, search?: string, hash?: string) {
      return `${path}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url: string) {
      return locationFromUrl(url);
    },
    push(
      url: string,
      state: object | null = null,
      title: string | null = null
    ) {
      if (cb) {
        cb('push', { url, state, title });
      }
      return true;
    },
    replace(
      url: string,
      state: object | null = null,
      title: string | null = null
    ) {
      if (cb) {
        cb('replace', { url, state, title });
      }
      return true;
    },
    navigate(url: string, state: object = {}) {
      location$.next({ ...locationFromUrl(url, state), source: 'pop' });
    },
    location: location$.pipe(
      startWith<Location>({ ...locationFromUrl(initialUrl), source: 'init' }),
      publishReplay(1),
      refCount()
    ),
  };
}
