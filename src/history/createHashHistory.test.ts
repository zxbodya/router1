import { first, take } from 'rxjs/operators';

import { createHashHistory } from './createHashHistory';

// tslint:disable-next-line no-namespace
declare namespace global {
  let window: any;
}

describe('createHashHistory legacy browsers', () => {
  beforeEach(() => {
    global.window = {
      onhashchange: undefined,
      addListener(e: any, l: any) {
        this.onhashchange = l;
      },
      removeListener() {
        this.onhashchange = undefined;
      },
      location: {
        pathname: '',
        search: '',
        hash: '#/abc?qwe#123',
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
    const h = createHashHistory();
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

  it('uses assign and replace to update location', done => {
    const h = createHashHistory();
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
        expect(global.window.location.assignCallCount).toEqual(1);
        expect(global.window.location.replaceCallCount).toEqual(1);
        done();
      }
      count += 1;
    });

    setTimeout(() => {
      h.push('/');
      h.replace('/');
      global.window.onhashchange();
    });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    const location = h.parseUrl('#/abc?qwe#123');
    expect(location).toEqual({
      pathname: '/abc',
      search: 'qwe',
      hash: '123',
      state: {},
    });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    const url = h.createUrl('/abc', 'qwe', '123');
    expect(url).toEqual('#/abc?qwe#123');
  });
});

describe('createHashHistory modern browsers', () => {
  beforeEach(() => {
    global.window = {
      onpopstate: undefined,
      addListener(e: any, l: any) {
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
        pathname: '',
        search: '',
        hash: '#/abc?qwe#123',
      },
    };
  });

  it('has correct initial location', done => {
    const h = createHashHistory();
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
    const h = createHashHistory();

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
      global.window.onpopstate();
    });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    const location = h.parseUrl('#/abc?qwe#123');
    expect(location).toEqual({
      pathname: '/abc',
      search: 'qwe',
      hash: '123',
      state: {},
    });

    const location1 = h.parseUrl('');
    expect(location1).toEqual({
      pathname: '/',
      search: '',
      hash: '',
      state: {},
    });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    expect(h.createUrl('/abc', 'qwe', '123')).toEqual('#/abc?qwe#123');
    expect(h.createUrl('/abc', '', '123')).toEqual('#/abc#123');
    expect(h.createUrl('/abc', '123', '')).toEqual('#/abc?123');
    expect(h.createUrl('/abc', '', '')).toEqual('#/abc');
    expect(h.createUrl('/', '', '')).toEqual('');
  });

  it('has correct initial location when hash is empty', done => {
    global.window.location.hash = '';
    const h = createHashHistory();
    h.location.pipe(first()).subscribe(location => {
      expect(location).toEqual({
        pathname: '/',
        search: '',
        hash: '',
        source: 'init',
        state: {},
      });
      done();
    });
  });
});
