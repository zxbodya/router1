export function createGenerator(info) {
  const generateParts = info[1];
  const paramNames = info[2];
  const partsCount = generateParts.length;

  return (params = {}) => {
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const missingParams = paramNames.filter(
        paramName => !(paramName in params)
      );

      if (missingParams.length) {
        throw new Error(`missing parameters [${missingParams.join(',')}]`);
      }
    }

    const res = [];
    for (let i = 0, pn = 0; i < partsCount; i += 1) {
      const g = generateParts[i];
      if (g !== null) {
        res.push(g);
      } else {
        res.push(params[paramNames[pn]]);
        pn += 1;
      }
    }
    // todo: test if matcher can match the result, and throw if it can not
    return res.join('');
  };
}
