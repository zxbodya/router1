import compileExpression from './compile.js';
import matcherFromExpression from './createMatcher.js';

describe('Router, matcher from expression', () => {
  it('it matches strings without params', ()=> {
    const expression = compileExpression('aaaaa');
    const matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa')).toEqual({});
    expect(matcher('aaaaaa')).toEqual(false);
    expect(matcher('/aaaaa')).toEqual(false);
    expect(matcher('aaaaa/')).toEqual(false);
  });

  it('it matches strings with one param', ()=> {
    const expression = compileExpression('aaaaa<a>');
    const matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa123')).toEqual({a: '123'});
    expect(matcher('aaaaa321')).toEqual({a: '321'});
    expect(matcher('aaaaaa')).toEqual({a: 'a'});
    expect(matcher('1aaaaaa')).toEqual(false);
  });

  it('it generates strings with few params', ()=> {
    const expression = compileExpression('aaaaa<a>-<b>');
    const matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa321-1')).toEqual({a: '321', b: '1'});
    expect(matcher('aaaaa321-444')).toEqual({a: '321', b: '444'});
    expect(matcher('aaaaa321-')).toEqual({a: '321', b: ''});
    expect(matcher('aaaaa-444')).toEqual({a: '', b: '444'});
    expect(matcher('aaaaa-')).toEqual({a: '', b: ''});
    expect(matcher('aaaaa')).toEqual(false);
  });

  it('it matches strings with param regexp', ()=> {
    const expression = compileExpression('aaaaa<a:\\d+>');
    const matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa123')).toEqual({a: '123'});
    expect(matcher('aaaaa321')).toEqual({a: '321'});
    expect(matcher('aaaaaa')).toEqual(false);
    expect(matcher('aaaaa123a')).toEqual(false);
  });
});
