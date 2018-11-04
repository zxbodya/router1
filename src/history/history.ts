import { Observable } from 'rxjs';

export type LocationSource = 'init' | 'pop' | 'replace' | 'push';

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state?: object;
  source?: LocationSource;
}

export interface History {
  push: (url: string, state?: object, title?: string) => void;
  replace: (url: string, state?: object, title?: string) => void;
  createUrl: (path: string, search: string, hash: string) => string;
  parseUrl: (url: string) => Location;
  location: Observable<Location>;
}
