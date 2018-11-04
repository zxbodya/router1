import { CompiledExpression } from './compile';
import { concat } from './concat';

describe('concat', () => {
  it('works with one arg', () => {
    // '<a:\\d+>'
    const exp1: CompiledExpression = ['(\\d+)', ['', null, ''], ['a']];

    expect(concat([exp1])).toEqual(exp1);
  });

  it('works with two args', () => {
    // '<a:\\d+>' + '<b:\\d+>'
    const exp1: CompiledExpression = ['(\\d+)', ['', null, ''], ['a']];
    const exp2: CompiledExpression = ['(\\d+)', ['', null, ''], ['b']];
    const exp12: CompiledExpression = [
      '(\\d+)(\\d+)',
      ['', null, '', '', null, ''],
      ['a', 'b'],
    ];

    expect(concat([exp1, exp2])).toEqual(exp12);
  });
});
