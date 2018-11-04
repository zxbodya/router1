import { CompiledExpression } from './compile';

/**
 * Concatenates compiled expressions
 *
 * @param expressions
 * @return {*[]}
 */
export function concat(expressions: CompiledExpression[]): CompiledExpression {
  let exp = '';
  let params: string[] = [];
  let parts: Array<string | null> = [];

  for (let i = 0, l = expressions.length; i < l; i += 1) {
    const partPath = expressions[i];
    exp += partPath[0];
    parts = parts.concat(partPath[1]);
    params = params.concat(partPath[2]);
  }
  return [exp, parts, params];
}
