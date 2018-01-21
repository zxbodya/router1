import { compile } from './compile';
import { createMatcher } from './createMatcher';

describe('Router, matcher from expression', () => {
  it('matches strings without params', () => {
    const expression = compile('aaaaa');
    const matcher = createMatcher(expression);

    expect(matcher('aaaaa')).toEqual({});
    expect(matcher('aaaaaa')).toEqual(null);
    expect(matcher('/aaaaa')).toEqual(null);
    expect(matcher('aaaaa/')).toEqual(null);
  });

  it('matches strings with one param', () => {
    const expression = compile('aaaaa<a>');
    const matcher = createMatcher(expression);

    expect(matcher('aaaaa123')).toEqual({ a: '123' });
    expect(matcher('aaaaa321')).toEqual({ a: '321' });
    expect(matcher('aaaaaa')).toEqual({ a: 'a' });
    expect(matcher('1aaaaaa')).toEqual(null);
  });

  it('generates strings with few params', () => {
    const expression = compile('aaaaa<a>-<b>');
    const matcher = createMatcher(expression);

    expect(matcher('aaaaa321-1')).toEqual({ a: '321', b: '1' });
    expect(matcher('aaaaa321-444')).toEqual({ a: '321', b: '444' });
    expect(matcher('aaaaa321-')).toEqual({ a: '321', b: '' });
    expect(matcher('aaaaa-444')).toEqual({ a: '', b: '444' });
    expect(matcher('aaaaa-')).toEqual({ a: '', b: '' });
    expect(matcher('aaaaa')).toEqual(null);
  });

  it('matches strings with param regexp', () => {
    const expression = compile('aaaaa<a:\\d+>');
    const matcher = createMatcher(expression);

    expect(matcher('aaaaa123')).toEqual({ a: '123' });
    expect(matcher('aaaaa321')).toEqual({ a: '321' });
    expect(matcher('aaaaaa')).toEqual(null);
    expect(matcher('aaaaa123a')).toEqual(null);
  });

  it('decodes path before matching', () => {
    const expression = compile('<a>/<b>');
    const matcher = createMatcher(expression);
    expect(
      matcher(
        "%D0%BF%D1%80%D0%B8%D0%B2%D1%96%D1%82/%3F%23aZ09.-_~!$&%5C'()*+,;=:@"
      )
    ).toMatchSnapshot();
  });
});
