export function compile(expression) {
  // http://stackoverflow.com/questions/8844256/split-string-including-regular-expression-match
  const textParts = expression.split(/<([^>:]+?)(?::([^>]+))?>/);
  const matcher = [];
  const generateParts = [];
  const paramNames = [];
  for (let i = 0, l = textParts.length; i < l; i += 1) {
    const part = textParts[i];
    if (i % 3 === 0) {
      //  http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#answer-6969486
      matcher.push(part.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&'));
      generateParts.push(part);

      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        // url part contains unmathced params
        if (/[<>]/.test(part)) {
          throw new Error(`syntax error in expression "${expression}"`);
        }
      }
    }
    if (i % 3 === 1) {
      paramNames.push(part);
      generateParts.push(null);
    }
    if (i % 3 === 2) {
      if (part) {
        /* istanbul ignore else */
        if (process.env.NODE_ENV !== 'production') {
          // verify expression if it has captures - throw an error
          if (/\([^?]/.test(part)) {
            throw new Error(
              `syntax error in expression "${expression}", param regexp ${part} contain capture groups`
            );
          }
        }

        matcher.push('(', part, ')');
      } else {
        matcher.push('(.*)');
      }
    }
  }
  return [matcher.join(''), generateParts, paramNames];
}
