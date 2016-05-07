import { Observable } from 'rx';
import { splitUrl } from './utils/splitUrl';

export function createServerHistory(url) {
  const [pathname, search, hash] = splitUrl(url);
  return {
    push() {
      throw new Error('navigation not supported');
    },
    replace() {
      throw new Error('navigation not supported');
    },
    location: Observable
      .return({
        pathname,
        search: search ? `?${search}` : '',
        hash: hash ? `#${hash}` : '',
        state: {},
      })
      .shareReplay(),
  };
}
