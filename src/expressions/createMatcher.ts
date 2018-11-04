import { CompiledExpression } from './compile';

export function createMatcher(
  info: CompiledExpression
): (path: string) => { [k: string]: string } | null {
  const matcher = info[0];
  const paramNames = info[2];
  const matcherExp = new RegExp(`^${matcher}$`);

  return (path: string): { [k: string]: string } | null => {
    const matches = decodeURI(path)
      .replace(/(?:%3F|%23)/g, c => (c === '%3F' ? '?' : '#'))
      .match(matcherExp);
    let res = null;
    if (matches) {
      res = {} as { [k: string]: string };
      for (let i = 0, l = paramNames.length; i < l; i += 1) {
        res[paramNames[i]] = matches[i + 1];
      }
    }
    return res;
  };
}
