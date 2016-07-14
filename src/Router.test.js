import { Router } from './Router';
import { Observable, helpers } from 'rx';
import { createTestHistory } from './createTestHistory';

const createTestHandler = (options = {}) =>
  (transition, route = { name: null, handlers: [] }, params = {}) =>
    ({
      load: () => Promise.resolve(true),
      hashChange: options.hashChange || helpers.noop,
      onBeforeUnload: options.onBeforeUnload || (() => ''),
      render() {
        const { location } = transition;
        return Observable.return({
          route: route.name,
          handlers: route.handlers,
          params,
          location,
        });
      },
    });

describe('Router', () => {
  it('works with empty route collection', (done) => {
    const history = createTestHistory('/');
    const router = new Router({
      routes: [],
      history,
      createNotFoundHandler: createTestHandler(),
      createHandler: createTestHandler(),
    });

    const t = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(router.createUrl('main', {}, '')).toEqual('#route-main-not-found');
    process.env.NODE_ENV = 'production';
    expect(router.createUrl('main', {}, '')).toEqual('#');
    process.env.NODE_ENV = t;

    expect(router.isActive('main')).toEqual(false);

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual(null);
      expect(renderResult.params).toEqual({});
      expect(renderResult.handlers).toEqual([]);
      expect(renderResult.location).toEqual({ pathname: '/', search: '', hash: '', state: {}, source: 'init' });

      expect(router.isActive('main')).toEqual(false);
      expect(router.activeRoute[0]).toEqual(null);
      expect(router.activeRoute[1]).toEqual({});
    }, () => {
    }, () => {
      done();
    });
  });

  it('matches route', (done) => {
    const history = createTestHistory('/');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/',
      }],
      history,
      createNotFoundHandler: createTestHandler(),
      createHandler: createTestHandler(),
    });

    expect(router.createUrl('main', {}, '')).toEqual('/');
    expect(router.createUrl('main2', {}, '')).toEqual('#route-main2-not-found');

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({});
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/', search: '', hash: '', state: {}, source: 'init' });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      done();
    });
  });

  it('matches route with params', (done) => {
    const history = createTestHistory('/123');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/<page:\\d+>',
      }],
      history,
      createNotFoundHandler: createTestHandler(),
      createHandler: createTestHandler(),
    });

    expect(router.createUrl('main', { page: 1000 }, '')).toEqual('/1000');

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/123', search: '', hash: '', state: {}, source: 'init' });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      expect(router.isActive('main', { page: '123' })).toEqual(true);
      expect(router.isActive('main', { page: '321' })).toEqual(false);
      done();
    });
  });

  it('matches route with params and search query and hash', (done) => {
    const history = createTestHistory('/123?q=text#anchor');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/<page:\\d+>?q',
      }],
      history,
      createNotFoundHandler: createTestHandler(),
      createHandler: createTestHandler(),
    });

    expect(router.createUrl('main', { page: 1000, q: 1234 }, '')).toEqual('/1000?q=1234');
    expect(router.createUrl('main', { page: 1000, q: 1234 }, 'anchor')).toEqual('/1000?q=1234#anchor');

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123', q: 'text' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({
        pathname: '/123',
        search: 'q=text',
        hash: 'anchor',
        state: {},
        source: 'init',
      });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
      expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
      expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(false);
      expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(false);
      done();
    });
  });

  it('navigates', (done) => {
    const history = createTestHistory('/123?q=text#anchor');

    let hashChangeCount = 0;
    const router = new Router({
      routes: [
        {
          name: 'main',
          handler: 'main',
          url: '/<page:\\d+>?q',
        },
        {
          name: 'main1',
          handler: 'main1',
          url: '/m2/<page:\\d+>?q',
        },
      ],
      history,
      createNotFoundHandler: createTestHandler(),
      createHandler: createTestHandler({
        hashChange(location) {
          if (hashChangeCount === 0) {
            // router.navigate
            expect(location).toEqual({ pathname: '/123', search: 'q=text', hash: 'anc', state: {}, source: 'push' });
          }
          if (hashChangeCount === 1) {
            // onpopstate
            expect(location).toEqual({ pathname: '/123', search: 'q=text', hash: 'anc2', state: {}, source: 'pop' });
          }
          hashChangeCount += 1;
        },
      }),
    });

    let count = 0;

    router.renderResult().take(3).subscribe(renderResult => {
      if (count === 0) {
        expect(renderResult.route).toEqual('main');
        expect(renderResult.params).toEqual({ page: '123', q: 'text' });
        expect(renderResult.handlers).toEqual(['main']);
        expect(renderResult.location).toEqual({
          pathname: '/123',
          search: 'q=text',
          hash: 'anchor',
          state: {},
          source: 'init',
        });


        expect(router.isActive('main')).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(false);
        expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(false);
      }

      if (count === 1) {
        expect(renderResult.route).toEqual('main1');
        expect(renderResult.params).toEqual({ page: '123', q: false });
        expect(renderResult.handlers).toEqual(['main1']);
        expect(renderResult.location).toEqual({ pathname: '/m2/123', search: '', hash: '', state: {}, source: 'push' });

        expect(router.isActive('main1')).toEqual(true);
        expect(router.isActive('main1', { page: '123' })).toEqual(true);
        expect(router.isActive('main1', { page: '123', q: false })).toEqual(true);
        expect(router.isActive('main1', { page: '123', q: 'tex' })).toEqual(false);
        expect(router.isActive('main1', { page: '12', q: 'text' })).toEqual(false);
      }
      if (count === 2) {
        expect(renderResult.route).toEqual('main');
        expect(renderResult.params).toEqual({ page: '123', q: 'text' });
        expect(renderResult.handlers).toEqual(['main']);
        expect(renderResult.location).toEqual({
          pathname: '/123',
          search: 'q=text',
          hash: 'anc',
          state: { a: true },
          source: 'push',
        });


        expect(router.isActive('main')).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(true);
        expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(false);
        expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(false);
      }
      count += 1;
    }, () => {
    }, () => {
      done();
    });
    setTimeout(() => {
      router.navigate('main', { page: '123', q: 'text' }, 'anc');
      history.navigate('/123?q=text#anc2', {});
      router.navigate('main1', { page: '123' });
      router.navigate('main', { page: '123', q: 'text' }, 'anc', { a: true });
    }, 10);
  });


  it('uses onBeforeUnload', (done) => {
    const history = createTestHistory('/');

    global.confirm = txt => txt === 'yes';

    let answer = 'no';

    const testHandlerOptions = {
      onBeforeUnload: () => answer,
    };
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/',
      }, {
        name: 'main2',
        handler: 'main2',
        url: '/2',
      }],
      history,
      createNotFoundHandler: createTestHandler(testHandlerOptions),
      createHandler: createTestHandler(testHandlerOptions),
    });

    router.start();

    setTimeout(() => {
      answer = 'no';
      router.navigate('main2', {});
    }, 5);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      answer = 'no';
      history.navigate('/2');
    }, 10);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      answer = 'yes';
      history.navigate('/2');
    }, 20);

    setTimeout(() => {
      expect(router.isActive('main2')).toEqual(true);
      answer = 'yes';
      router.navigate('main', {});
    }, 30);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      router.stop();
      done();
    }, 40);
  });

  it('handles transition.forward calls', (done) => {
    const history = createTestHistory('/');

    const createHandler = (transition, route = { name: null, handlers: [] }) =>
      ({
        load: () => Promise.resolve(true),
        hashChange: helpers.noop,
        onBeforeUnload: () => '',
        render() {
          return Observable.return(route.handlers[0](transition));
        },
      });

    const router = new Router({
      routes: [
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: t => t.forward('/3'),
          url: '/2',
        },
        {
          name: 'main3',
          handler: () => 'main3',
          url: '/3',
        },
        {
          name: 'main4',
          handler: t => (t.location.hash === '' ? t.forward('/4#123') : ''),
          url: '/4',
        },
      ],
      history,
      createNotFoundHandler: createHandler,
      createHandler,
    });

    router.start();

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      router.navigate('main2', {});
    }, 5);

    setTimeout(() => {
      expect(router.isActive('main3')).toEqual(true);
      router.navigate('main4', {});
    }, 10);

    setTimeout(() => {
      expect(router.isActive('main4')).toEqual(true);
      expect(router.currentLocation.hash).toEqual('123');
      router.stop();
      done();
    }, 15);
  });

  it('crashes when transition.forward navigates to same page', (done) => {
    const history = createTestHistory('/');

    const createHandler = (transition, route = { name: null, handlers: [] }) =>
      ({
        load: () => Promise.resolve(true),
        hashChange: helpers.noop,
        onBeforeUnload: () => '',
        render() {
          return Observable.return(route.handlers[0](transition));
        },
      });

    const router = new Router({
      routes: [
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: t => t.forward('/2'),
          url: '/2',
        },
      ],
      history,
      createNotFoundHandler: createHandler,
      createHandler,
    });

    let hasError = false;
    router.renderResult().subscribeOnError(() => {
      hasError = true;
    });

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      router.navigate('main2', {});
    }, 5);

    setTimeout(() => {
      expect(hasError).toEqual(true);
      router.stop();
      done();
    }, 10);
  });


  it('crashes when transition.forward calls cause redirect loop', (done) => {
    const history = createTestHistory('/');

    const createHandler = (transition, route = { name: null, handlers: [] }) =>
      ({
        load: () => Promise.resolve(true),
        hashChange: helpers.noop,
        onBeforeUnload: () => '',
        render() {
          return Observable.return(route.handlers[0](transition));
        },
      });

    const router = new Router({
      routes: [
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: t => t.forward('/3'),
          url: '/2',
        },
        {
          name: 'main3',
          handler: t => t.forward('/2'),
          url: '/3',
        },
      ],
      history,
      createNotFoundHandler: createHandler,
      createHandler,
    });

    let hasError = false;
    router.renderResult().subscribeOnError(() => {
      hasError = true;
    });

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      router.navigate('main2', {});
    }, 5);

    setTimeout(() => {
      expect(hasError).toEqual(true);
      router.stop();
      done();
    }, 30);
  });
});
