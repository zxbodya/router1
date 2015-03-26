let matcherFromExpression = (info)=> {
  let [matcher,,paramNames]  = info;
  let matcherExp = new RegExp('^' + matcher + '$');

  return (path)=> {
    let matches, res = false;
    if (matches = path.match(matcherExp)) {
      //todo: verify matches count
      res = {};
      for (let i = 0, l = matches.length; i < l; i++) {
        res[paramNames[i]] = matches[i];
      }
    }
    return res;
  }
};

module.exports = matcherFromExpression;
