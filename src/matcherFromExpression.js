'use strict';

let matcherFromExpression = (info)=> {
  let matcher = info[0], paramNames = info[2];
  let matcherExp = new RegExp('^' + matcher + '$');

  return (path)=> {
    let matches, res = false;
    if (matches = path.match(matcherExp)) {
      res = {};
      for (let i = 0, l = paramNames.length; i < l; i++) {
        res[paramNames[i]] = matches[i + 1];
      }
    }
    return res;
  }
};

module.exports = matcherFromExpression;
