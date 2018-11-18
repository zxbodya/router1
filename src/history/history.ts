import { Observable } from 'rxjs';

export type NavigateSource = 'push' | 'replace';
export type LocationSource = 'init' | 'pop' | NavigateSource;

export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: object & { noscroll?: boolean };
  source?: LocationSource;
}

export interface History {
  push: (url: string, state?: object | null, title?: string) => void;
  replace: (url: string, state?: object | null, title?: string) => void;
  createUrl: (path: string, search: string, hash: string) => string;
  parseUrl: (url: string) => Location;
  location: Observable<Location>;
}
