import { createBrowserHistory } from './createBrowserHistory';

describe('createBrowserHistory legacy browsers', () => {
  beforeEach(() => {
    global.window = {};
    global.window.history = {
      state: {},
    };
    global.window.location = {
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
    };
  });

  it('has correct initial location', (done) => {
    const h = createBrowserHistory();
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', (done) => {
    const h = createBrowserHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
    });

    h.location.skip(1).first().subscribe(location => {
      expect(location.source).toEqual('push');
    });

    h.location.skip(2).first().subscribe(location => {
      expect(location.source).toEqual('replace');
      expect(global.window.location.assignCallCount).toEqual(1);
      expect(global.window.location.replaceCallCount).toEqual(1);
      done();
    });

    setTimeout(() => {
      h.push('/');
    });
    setTimeout(() => {
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
    };
    global.window.history = {
      pushCallCount: 0,
      pushState() {
        this.pushCallCount += 1;
      },
      replaceCallCount: 0,
      replaceState() {
        this.replaceCallCount += 1;
      },
      state: {},
    };
    global.window.location = {
      pathname: '/abc',
      search: '?qwe',
      hash: '#123',
    };
  });

  it('has correct initial location', (done) => {
    const h = createBrowserHistory();
    h.location.subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', (done) => {
    const h = createBrowserHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: '?qwe', hash: '#123', source: 'init', state: {} });
    });

    h.location.skip(1).first().subscribe(location => {
      expect(location.source).toEqual('push');
    });

    h.location.skip(2).first().subscribe(location => {
      expect(location.source).toEqual('replace');
      expect(global.window.history.pushCallCount).toEqual(1);
      expect(global.window.history.replaceCallCount).toEqual(1);
    });
    h.location.skip(3).first().subscribe(location => {
      expect(location.source).toEqual('pop');
      done();
    });

    setTimeout(() => {
      h.push('/');
    });
    setTimeout(() => {
      h.replace('/');
    });
    setTimeout(() => {
      global.window.onpopstate();
    });
  });
});
