import { RouteParams } from '../Router';

export function pickValues(data: RouteParams, keys: string[]): RouteParams {
  const res: RouteParams = {};
  keys.forEach(name => {
    res[name] = data[name] === undefined ? false : data[name];
  });
  return res;
}

export function parse(
  query: string,
  keys: null | string[] = null
): RouteParams {
  const data: RouteParams = {};
  query.split('&').forEach(part => {
    if (part === '') {
      return;
    }
    const parts = part.split('=');
    const name = decodeURIComponent(parts[0]);
    const rawValue = parts[1];
    data[name] =
      rawValue || rawValue === '' ? decodeURIComponent(rawValue) : true;
  });
  if (keys === null) {
    return data;
  }
  return pickValues(data, keys);
}

export function generate(
  params: RouteParams,
  keys: string[] = Object.keys(params)
): string {
  return keys
    .map(name => {
      const value = params[name];
      if (!value && value !== '') {
        return '';
      }
      return (
        encodeURIComponent(name) +
        (value !== true ? `=${encodeURIComponent(value)}` : '')
      );
    })
    .filter(part => part.length > 0)
    .join('&');
}
