import { Observable } from 'rx';
import { locationFromUrl } from './utils/locationFromUrl';

export function createServerHistory(url) {
  return {
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
