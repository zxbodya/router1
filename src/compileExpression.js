const compileExpression = (expression)=> {
  //todo: for non-production verify expression syntax
  if (process.env.NODE_ENV !== 'production') {
    if (!/^(?:(?:[^<>:])*(?:<([^>:]+?)(?::([^>]+))?>)*(?:[^<>:])*)*$/.test(expression)) {
      throw new Error(`syntax error in expression "${expression}"`);
    }
  }
  //todo: if syntax is not valid show messages about typical errors

  // http://stackoverflow.com/questions/8844256/split-string-including-regular-expression-match
  let textParts = expression.split(/<([^>:]+?)(?::([^>]+))?>/);
  let matcher = [];
  let generateParts = [];
  let paramNames = [];
  for (let i = 0, l = textParts.length; i < l; i++) {
    let part = textParts[i];
    if (i % 3 === 0) {
      //  http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex#answer-6969486
      matcher.push(part.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
      generateParts.push(part);
    }
    if (i % 3 === 1) {
      paramNames.push(part);
      generateParts.push(null);
    }
    if (i % 3 === 2) {
      //todo: verify expression if it has captures - throw an error
      if (part) {
        if (process.env.NODE_ENV !== 'production') {
          if (/\([^?]/.test(part)) {
            throw new Error(`syntax error in expression "${expression}", param regexp ${part} contain capture groups`);
          }
        }

        matcher.push('(', part, ')');
      } else {
        matcher.push('(.*)');
      }
    }
  }
  return [matcher.join(''), generateParts, paramNames];
};

export default compileExpression;
