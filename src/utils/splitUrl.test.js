import { splitUrl } from './splitUrl';

describe('splitUrl', () => {
  it('works with empty', () => {
    expect(splitUrl('')).toEqual(['', '', '']);
  });
  it('works with empty', () => {
    expect(splitUrl('?#')).toEqual(['', '', '']);
  });
  it('works with pathname only', () => {
    expect(splitUrl('a')).toEqual(['a', '', '']);
  });
  it('works with search only', () => {
    expect(splitUrl('?a')).toEqual(['', 'a', '']);
  });
  it('works with hash only', () => {
    expect(splitUrl('#a')).toEqual(['', '', 'a']);
  });
  it('works with complete', () => {
    expect(splitUrl('a?b#c')).toEqual(['a', 'b', 'c']);
  });
});
