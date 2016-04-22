import createServerHistory from './createServerHistory';

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
    let h;
    h = createServerHistory('/abc?qwe#123');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });
      done();
    });

    h = createServerHistory('/abc#123');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '', hash: '#123', state: {} });
      done();
    });

    h = createServerHistory('/abc');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '', hash: '', state: {} });
      done();
    });

    h = createServerHistory('');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '', search: '', hash: '', state: {} });
      done();
    });
  });
});
