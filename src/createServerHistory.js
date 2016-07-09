import { Observable } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

export function createServerHistory(url) {
  return {
    createUrl(pathname, search, hash) {
      return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    },
    parseUrl(url){
      return locationFromUrl(url);
    },
    push() {
      throw new Error('navigation not supported');
    },
    replace() {
      throw new Error('navigation not supported');
    },
    location: Observable
      .return(
        locationFromUrl(url)
      )
      .shareReplay(1),
  };
}
