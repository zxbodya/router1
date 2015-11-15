/**
 * Concatenates compiled expressions
 *
 * NOT USED
 * maybe would be useful in future, if there would be need to do nested states
 *
 * @param expressions
 * @return {*[]}
 */
export default function contactExpressions(expressions) {
  let exp = '';
  let params = [];
  let parts = [];

  for (let i = 0, l = expressions.length; i < l; i++) {
    const partPath = expressions[i];
    exp += partPath[0];
    parts = parts.concat(partPath[1]);
    params = params.concat(partPath[2]);
  }
  return [exp, parts, params];
}
