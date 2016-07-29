import { config } from 'rx';
import { createHashHistory } from './createHashHistory';

if (process.env.NODE_ENV !== 'production') {
  config.longStackSupport = true;
}

describe('createHashHistory legacy browsers', () => {
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
        state: {},
      },
    };
  });

  it('has correct initial location', (done) => {
    const h = createHashHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location', (done) => {
    const h = createHashHistory();
    let count = 0;
    h.location.take(2).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', source: 'init', state: {} });
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
      window.onhashchange();
    });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    const location = h.parseUrl('#/abc?qwe#123');
    expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', state: {} });
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
        pathname: '',
        search: '',
        hash: '#/abc?qwe#123',
      },
    };
  });

  it('has correct initial location', (done) => {
    const h = createHashHistory();
    h.location.first().subscribe(location => {
      expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', source: 'init', state: {} });
      done();
    });
  });

  it('uses assign and replace to update location, emits correct events', (done) => {
    const window = global.window;
    const h = createHashHistory();

    let count = 0;
    h.location.take(2).subscribe(location => {
      if (count === 0) {
        expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', source: 'init', state: {} });
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
    const h = createHashHistory();
    const location = h.parseUrl('#/abc?qwe#123');
    expect(location).toEqual({ pathname: '/abc', search: 'qwe', hash: '123', state: {} });
  });

  it('has working parseUrl method', () => {
    const h = createHashHistory();
    const url = h.createUrl('/abc', 'qwe', '123');
    expect(url).toEqual('#/abc?qwe#123');
  });
});
