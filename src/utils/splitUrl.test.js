import splitUrl from './splitUrl';

describe('splitUrl', ()=> {
  it('works with pathname only', ()=> {
    expect(splitUrl('a')).toEqual(['a', '', '']);
  });
  it('works with search only', ()=> {
    expect(splitUrl('?a')).toEqual(['', 'a', '']);
  });
  it('works with hash only', ()=> {
    expect(splitUrl('#a')).toEqual(['', '', 'a']);
  });
});
