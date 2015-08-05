let generatorFromExpression = (info)=> {
  let generateParts = info[1], paramNames = info[2];

  return (params = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      var missingParams = paramNames.filter(paramName=>!(paramName in params));

      if (missingParams.length) {
        throw new Error(`missing parameters [${missingParams.join(',')}]`);
      }
    }

    let res = [];
    for (let i = 0, l = generateParts.length, pn = 0, pl = paramNames.length; i < l; i++) {
      let g = generateParts[i];
      if (g !== null) {
        res.push(g);
      } else {
        if (pn < pl) {
          res.push(params[paramNames[pn]]);
          pn++;
        }
      }
    }
    //todo: test if matcher can match the result, and throw if it can not
    return res.join('');
  };
};

export default generatorFromExpression;
