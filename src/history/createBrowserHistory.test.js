import { take } from 'rxjs/operators/take';
import { first } from 'rxjs/operators/first';

import { createBrowserHistory } from './createBrowserHistory';

describe('createBrowserHistory legacy browsers', () => {
  beforeEach(() => {
    global.window = {
      onhashchange: undefined,
      addListener(e, l) {
        this.onhashchange = l;
      },
      removeListener() {
        this.onhashchange = undefined;
      },
      location: {
        pathname: '/abc',
        search: '?qwe',
        hash: '#123',
        assignCallCount: 0,
        assign() {
          this.assignCallCount += 1;
        },
        replaceCallCount: 0,
        replace() {
          this.replaceCallCount += 1;
        },
      },
      history: {
        state: null,
      },
    };
  });

  it('has correct initial location', done => {
    const h = createBrowserHistory();
    h.location.pipe(first()).subscribe(location => {
      expect(location).toEqual({
        pathname: '/abc',
        search: 'qwe',
        hash: '123',
        source: 'init',
        state: {},
      });
      done();
    });
  });

  it('location updated on hash change', done => {
    const h = createBrowserHistory();
    let count = 0;
    h.location.pipe(take(2)).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({
          pathname: '/abc',
          search: 'qwe',
          hash: '123',
          source: 'init',
          state: {},
        });
      }
      if (count === 1) {
        expect(location).toEqual({
          pathname: '/abc',
          search: 'qwe',
          hash: '125',
          source: 'pop',
          state: {},
        });
        done();
      }
      count += 1;
    });

    setTimeout(() => {
      global.window.location.hash = '#125';
      global.window.onhashchange();
    });
  });

  it('uses assign and replace to update location', done => {
    const h = createBrowserHistory();
    let count = 0;
    h.location.subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({
          pathname: '/abc',
          search: 'qwe',
          hash: '123',
          source: 'init',
          state: {},
        });
      }
      count += 1;
    });

    setTimeout(() => {
      h.push('/');
      h.replace('/');

      expect(global.window.location.assignCallCount).toEqual(1);
      expect(global.window.location.replaceCallCount).toEqual(1);
      done();
    });
  });

  it('has working parseUrl method', () => {
    const h = createBrowserHistory();
    const location = h.parseUrl('/abc?qwe#123');
    expect(location).toEqual({
      pathname: '/abc',
      search: 'qwe',
      hash: '123',
      state: {},
    });
  });

  it('has working parseUrl method', () => {
    const h = createBrowserHistory();
    const url = h.createUrl('/abc', 'qwe', '123');
    expect(url).toEqual('/abc?qwe#123');
  });

  it('updates hash if path and searh are not changed', () => {
    const h = createBrowserHistory();
    h.push('/abc?qwe#124');
    expect(global.window.location.hash).toEqual('#124');
    expect(global.window.location.assignCallCount).toEqual(0);
    h.replace('/abc?qwe#125');
    expect(global.window.location.hash).toEqual('#125');
    expect(global.window.location.assignCallCount).toEqual(0);
  });
});

describe('createBrowserHistory modern browsers', () => {
  beforeEach(() => {
    global.window = {
      onpopstate: undefined,
      addListener(e, l) {
        this.onpopstate = l;
      },
      removeListener() {
        this.onpopstate = undefined;
      },

      history: {
        pushCallCount: 0,
        pushState() {
          this.pushCallCount += 1;
        },
        replaceCallCount: 0,
        replaceState() {
          this.replaceCallCount += 1;
        },
        state: {},
      },
      location: {
        pathname: '/abc',
        search: '?qwe',
        hash: '#123',
      },
    };
  });

  it('has correct initial location', done => {
    const h = createBrowserHistory();
    h.location.pipe(first()).subscribe(location => {
      expect(location).toEqual({
        pathname: '/abc',
        search: 'qwe',
        hash: '123',
        source: 'init',
        state: {},
      });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', done => {
    const { window } = global;
    const h = createBrowserHistory();

    let count = 0;
    h.location.pipe(take(2)).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({
          pathname: '/abc',
          search: 'qwe',
          hash: '123',
          source: 'init',
          state: {},
        });
      }
      if (count === 1) {
        expect(location.source).toEqual('pop');
        expect(global.window.history.pushCallCount).toEqual(1);
        expect(global.window.history.replaceCallCount).toEqual(1);
        done();
      }
      count += 1;
    });

    setTimeout(() => {
      h.push('/');
      h.replace('/');
      window.onpopstate();
    });
  });

  it('has working parseUrl method', () => {
    const h = createBrowserHistory();
    const location = h.parseUrl('/abc?qwe#123');
    expect(location).toEqual({
      pathname: '/abc',
      search: 'qwe',
      hash: '123',
      state: {},
    });
  });

  it('has working createUrl method', () => {
    const h = createBrowserHistory();
    expect(h.createUrl('/abc', 'qwe', '123')).toEqual('/abc?qwe#123');
    expect(h.createUrl('/abc', '', '123')).toEqual('/abc#123');
    expect(h.createUrl('/abc', '123', '')).toEqual('/abc?123');
    expect(h.createUrl('/abc', '', '')).toEqual('/abc');
  });
});
