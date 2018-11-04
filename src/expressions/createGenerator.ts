import { Expresssion } from './compile';

export function createGenerator(info: Expresssion): (params: object) => string {
  const [, generateParts, paramNames] = info;
  const partsCount = generateParts.length;

  return (params: { [k: string]: any }): string => {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const missingParams = paramNames.filter(
        paramName => !(paramName in params)
      );

      if (missingParams.length) {
        throw new Error(`missing parameters [${missingParams.join(',')}]`);
      }
    }

    const res = [] as string[];
    for (let i = 0, pn = 0; i < partsCount; i += 1) {
      const g = generateParts[i];
      if (g !== null) {
        res.push(g);
      } else {
        res.push(`${params[paramNames[pn]]}`);
        pn += 1;
      }
    }
    return encodeURI(res.join('')).replace(
      /[?#]/g,
      c => (c === '?' ? '%3F' : '%23')
    );
  };
}
