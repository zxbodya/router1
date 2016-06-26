import { splitUrl } from './splitUrl';

export function locationFromUrl(url, state = {}) {
  const [pathname, search, hash] = splitUrl(url);
  return {
    pathname,
    search: search ? `?${search}` : '',
    hash: hash ? `#${hash}` : '',
    state,
  };
}
