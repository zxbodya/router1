import { createServerHistory } from './createServerHistory';

describe('createServerHistory', () => {
  it('throws on push', () => {
    const h = createServerHistory('/abc?qwe#123');
    expect(() => h.push()).toThrow();
  });

  it('throws on replace', () => {
    const h = createServerHistory('/abc?qwe#123');
    expect(() => h.replace()).toThrow();
  });

  it('returns location from passedUrl', (done) => {
    const h = createServerHistory('/abc?qwe#123');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });
      done();
    });
  });
});
