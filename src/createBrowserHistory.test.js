import { createBrowserHistory } from './createBrowserHistory';

describe('createBrowserHistory legacy browsers', () => {
  beforeEach(() => {
    global.window = {
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
        state: {},
      },
    };
  });

  it('has correct initial location', (done) => {
    const h = createBrowserHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', (done) => {
    const h = createBrowserHistory();
    let count = 0;
    h.location.take(3).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      }
      if (count === 1) {
        expect(location.source).toEqual('push');
      }
      if (count === 2) {
        expect(location.source).toEqual('replace');
        expect(global.window.location.assignCallCount).toEqual(1);
        expect(global.window.location.replaceCallCount).toEqual(1);
        done();
      }
      count += 1;
    });

    setTimeout(() => {
      h.push('/');
      h.replace('/');
    });
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

  it('has correct initial location', (done) => {
    const h = createBrowserHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', (done) => {
    const window = global.window;
    const h = createBrowserHistory();

    let count = 0;
    h.location.take(4).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      }
      if (count === 1) {
        expect(location.source).toEqual('push');
      }
      if (count === 2) {
        expect(location.source).toEqual('replace');
        expect(global.window.history.pushCallCount).toEqual(1);
        expect(global.window.history.replaceCallCount).toEqual(1);
      }
      if (count === 3) {
        expect(location.source).toEqual('pop');
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
});
