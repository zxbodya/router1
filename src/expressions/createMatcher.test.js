import compileExpression from './compile.js';
import matcherFromExpression from './createMatcher.js';

describe('Router, matcher from expression', function () {
  it('it matches strings without params', ()=> {
    let expression = compileExpression('aaaaa');
    let matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa')).toEqual({});
    expect(matcher('aaaaaa')).toEqual(false);
    expect(matcher('/aaaaa')).toEqual(false);
    expect(matcher('aaaaa/')).toEqual(false);
  });

  it('it matches strings with one param', ()=> {
    let expression = compileExpression('aaaaa<a>');
    let matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa123')).toEqual({a: '123'});
    expect(matcher('aaaaa321')).toEqual({a: '321'});
    expect(matcher('aaaaaa')).toEqual({a: 'a'});
    expect(matcher('1aaaaaa')).toEqual(false);
  });

  it('it generates strings with few params', ()=> {
    let expression = compileExpression('aaaaa<a>-<b>');
    let matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa321-1')).toEqual({a: '321', b: '1'});
    expect(matcher('aaaaa321-444')).toEqual({a: '321', b: '444'});
    expect(matcher('aaaaa321-')).toEqual({a: '321', b: ''});
    expect(matcher('aaaaa-444')).toEqual({a: '', b: '444'});
    expect(matcher('aaaaa-')).toEqual({a: '', b: ''});
    expect(matcher('aaaaa')).toEqual(false);
  });

  it('it matches strings with param regexp', ()=> {
    let expression = compileExpression('aaaaa<a:\\d+>');
    let matcher = matcherFromExpression(expression);

    expect(matcher('aaaaa123')).toEqual({a: '123'});
    expect(matcher('aaaaa321')).toEqual({a: '321'});
    expect(matcher('aaaaaa')).toEqual(false);
    expect(matcher('aaaaa123a')).toEqual(false);
  });
});
