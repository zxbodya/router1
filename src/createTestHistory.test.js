import { createTestHistory } from './createTestHistory';

describe('createTestHistory', () => {
  it('callback on push', (done) => {
    const h = createTestHistory('/abc?qwe#123', (action, location) => {
      expect(action).toEqual('push');
      expect(location).toEqual({
        url: '/bca?ewq#321',
        title: null,
        state: { a: true },
      });
      done();
    });
    h.push('/bca?ewq#321', { a: true });
  });

  it('callback on replace', (done) => {
    const h = createTestHistory('/abc?qwe#123', (action, location) => {
      expect(action).toEqual('replace');
      expect(location).toEqual({
        url: '/bca?ewq#321',
        title: null,
        state: { a: true },
      });
      done();
    });
    h.replace('/bca?ewq#321', { a: true });
  });

  it('returns location from passedUrl', (done) => {
    const h = createTestHistory('/abc?qwe#123');
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });
      done();
    });
  });

  it('has working parseUrl method', () => {
    const h = createTestHistory('/abc?qwe#123');
    const location = h.parseUrl('/abc?qwe#123');
    expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });
  });

  it('has working parseUrl method', () => {
    const h = createTestHistory('/abc?qwe#123');
    const url = h.createUrl('/abc', 'qwe', '123');
    expect(url).toEqual('/abc?qwe#123');
  });

  it('has working navigate method', done => {
    const h = createTestHistory('/abc?qwe#123');
    let count = 0;
    h.location.take(2).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', state: {} });
      }
      if (count === 1) {
        expect(location).toEqual({ pathname: '/cba', search: '?ewq', hash: '#321', state: {} });
      }
      count += 1;
    }, undefined, () => {
      done();
    });

    setTimeout(() => {
      h.navigate('/cba?ewq#321', {});
    }, 10);
  });
});
