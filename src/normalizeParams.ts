import { RouteParams } from './Router';

const has = Object.prototype.hasOwnProperty;

// values like would be parsed from generated url
export function normalizeParams(
  searchParams: string[],
  params: { [key: string]: any }
): RouteParams {
  const res = {} as RouteParams;
  for (const key in params) {
    /* istanbul ignore else */
    if (has.call(params, key)) {
      res[key] = `${params[key]}`;
    }
  }

  for (let i = 0, l = searchParams.length; i < l; i += 1) {
    const paramName = searchParams[i];
    if (paramName in params) {
      res[paramName] =
        typeof params[paramName] === 'boolean'
          ? params[paramName]
          : `${params[paramName]}`;
    }
  }
  return res;
}
