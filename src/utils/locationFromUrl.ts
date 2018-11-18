import { Location } from '../history/history';
import { splitUrl } from './splitUrl';

export function locationFromUrl(url: string, state: object = {}): Location {
  const [pathname, search, hash] = splitUrl(url);
  return {
    pathname,
    search,
    hash,
    state,
  };
}
