let generatorFromExpression = (info)=> {
  let [, generateParts, paramNames]  = info;

  return (params) => {
    //todo: check for missing parameters
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
    return res.join('');
  }
};

module.exports = generatorFromExpression;
