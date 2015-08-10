export default function contactExpressions(expressions) {
  let exp = '';
  let params = [];
  let parts = [];

  for (let i = 0, l = expressions.length; i < l; i++) {
    let partPath = expressions[i];
    exp += partPath[0];
    parts = parts.concat(partPath[1]);
    params = params.concat(partPath[2]);
  }
  return [exp, parts, params];
};
