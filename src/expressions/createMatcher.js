export function createMatcher(info) {
  const matcher = info[0];
  const paramNames = info[2];
  const matcherExp = new RegExp(`^${matcher}$`);

  return path => {
    const matches = decodeURI(path)
      .replace(/(?:%3F|%23)/g, c => ({ '%3F': '?', '%23': '#' }[c]))
      .match(matcherExp);
    let res = null;
    if (matches) {
      res = {};
      for (let i = 0, l = paramNames.length; i < l; i += 1) {
        res[paramNames[i]] = matches[i + 1];
      }
    }
    return res;
  };
}
