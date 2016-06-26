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
});
