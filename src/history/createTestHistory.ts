import { Observable, Subject } from 'rxjs';
import { publishReplay, refCount, startWith } from 'rxjs/operators';

import { locationFromUrl } from '../utils/locationFromUrl';

import { History, Location } from './history';

type Navigate = (url: string, state?: object | null) => void;
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
    },
    replace(
      url: string,
      state: object | null = null,
      title: string | null = null
    ) {
      if (cb) {
        cb('replace', { url, state, title });
      }
    },
    navigate(url: string, state?: object | null) {
      location$.next({ ...locationFromUrl(url, state), source: 'pop' });
    },
    location: location$.pipe(
      startWith({ ...locationFromUrl(initialUrl), source: 'init' } as Location),
      publishReplay(1),
      refCount()
    ) as Observable<Location>,
  };
}
