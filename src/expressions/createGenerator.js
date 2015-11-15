function generatorFromExpression(info) {
  const generateParts = info[1];
  const paramNames = info[2];

  return (params = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const missingParams = paramNames.filter(paramName=>!(paramName in params));

      if (missingParams.length) {
        throw new Error(`missing parameters [${missingParams.join(',')}]`);
      }
    }

    const res = [];
    for (let i = 0, l = generateParts.length, pn = 0, pl = paramNames.length; i < l; i++) {
      const g = generateParts[i];
      if (g !== null) {
        res.push(g);
      } else {
        if (pn < pl) {
          res.push(params[paramNames[pn]]);
          pn++;
        }
      }
    }
    // todo: test if matcher can match the result, and throw if it can not
    return res.join('');
  };
}

export default generatorFromExpression;
