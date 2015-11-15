function matcherFromExpression(info) {
  const matcher = info[0];
  const paramNames = info[2];
  const matcherExp = new RegExp('^' + matcher + '$');

  return (path)=> {
    const matches = path.match(matcherExp);
    let res = false;
    if (matches) {
      res = {};
      for (let i = 0, l = paramNames.length; i < l; i++) {
        res[paramNames[i]] = matches[i + 1];
      }
    }
    return res;
  };
}

export default matcherFromExpression;
