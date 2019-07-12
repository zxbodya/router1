/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs';

import { noop, of } from 'rxjs';
import { first, take } from 'rxjs/operators';

import { Router } from './Router';
import { RouteCollection } from './routes/RouteCollection';

import { createTestHistory } from './history/createTestHistory';
import { RouteParams, Transition } from './Router';
import { Route } from './routes/compileRoutes';

const createTestConfig = (
  config: any,
  options: {
    onHashChange?: any;
    onBeforeUnload?: any;
  } = {}
) => ({
  loadState(): Observable<{
    onHashChange: () => void;
    onBeforeUnload: () => string;
  }> {
    return of({
      onHashChange: options.onHashChange || noop,
      onBeforeUnload: options.onBeforeUnload || (() => ''),
    });
  },
  renderState(
    state: any,
    transition: Transition<any, any, any> & {
      route: Route<any>;
      params: RouteParams;
    }
  ): Observable<object> {
    return of({
      route: transition.route.name,
      handlers: transition.route.handlers,
      params: transition.params,
      location: transition.location,
    });
  },
  ...config,
});

type TestRouter = Router<any, { [a: string]: any }, any>;
describe('Router', () => {
  it('works with empty route collection', done => {
    const history = createTestHistory('/');
    const router: TestRouter = new Router(
      createTestConfig({
        routeCollection: new RouteCollection([]),
        history,
      })
    );

    const t = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(router.createUrl('main', {}, '')).toEqual('#route-main-not-found');
    process.env.NODE_ENV = 'production';
    expect(router.createUrl('main', {}, '')).toEqual('#');
    expect(router.createUrl('main', {})).toEqual('#');
    expect(router.createUrl('main')).toEqual('#');
    process.env.NODE_ENV = t;

    expect(router.isActive('main')).toEqual(false);

    router
      .renderResult()
      .pipe(first())
      .subscribe(
        renderResult => {
          expect(renderResult.route).toEqual('');
          expect(renderResult.params).toEqual({});
          expect(renderResult.handlers).toEqual([]);
          expect(renderResult.location).toEqual({
            pathname: '/',
            search: '',
            hash: '',
            state: {},
            source: 'init',
          });

          expect(router.isActive('main')).toEqual(false);
          expect(router.activeRoute[0]).toEqual('');
          expect(router.activeRoute[1]).toEqual({});
        },
        undefined,
        () => {
          router.stop();
          done();
        }
      );
    router.start();
  });

  it('matches route', done => {
    const history = createTestHistory('/');
    const router: TestRouter = new Router(
      createTestConfig({
        routeCollection: new RouteCollection([
          {
            name: 'main',
            handler: 'main',
            url: '/',
          },
        ]),
        history,
      })
    );

    expect(router.createUrl('main', {}, '')).toEqual('/');
    expect(router.createUrl('main2', {}, '')).toEqual('#route-main2-not-found');

    router
      .renderResult()
      .pipe(first())
      .subscribe(
        renderResult => {
          expect(renderResult.route).toEqual('main');
          expect(renderResult.params).toEqual({});
          expect(renderResult.handlers).toEqual(['main']);
          expect(renderResult.location).toEqual({
            pathname: '/',
            search: '',
            hash: '',
            state: {},
            source: 'init',
          });
        },
        undefined,
        () => {
          expect(router.isActive('main')).toEqual(true);
          router.stop();
          done();
        }
      );
    router.start();
  });

  it('matches route with params', done => {
    const history = createTestHistory('/123');
    const router: TestRouter = new Router(
      createTestConfig({
        routeCollection: new RouteCollection([
          {
            name: 'main',
            handler: 'main',
            url: '/<page:\\d+>',
          },
        ]),
        history,
      })
    );

    expect(router.createUrl('main', { page: '1000' }, '')).toEqual('/1000');

    router
      .renderResult()
      .pipe(first())
      .subscribe(
        renderResult => {
          expect(renderResult.route).toEqual('main');
          expect(renderResult.params).toEqual({ page: '123' });
          expect(renderResult.handlers).toEqual(['main']);
          expect(renderResult.location).toEqual({
            pathname: '/123',
            search: '',
            hash: '',
            state: {},
            source: 'init',
          });
        },
        undefined,
        () => {
          expect(router.isActive('main')).toEqual(true);
          expect(router.isActive('main', { page: '123' })).toEqual(true);
          expect(router.isActive('main', { page: '321' })).toEqual(false);
          router.stop();
          done();
        }
      );
    router.start();
  });

  it('matches route with params and search query and hash', done => {
    const history = createTestHistory('/123?q=text#anchor');
    const router: TestRouter = new Router(
      createTestConfig({
        routeCollection: new RouteCollection([
          {
            name: 'main',
            handler: 'main',
            url: '/<page:\\d+>?q',
          },
        ]),
        history,
      })
    );

    expect(router.createUrl('main', { page: '1000', q: '1234' }, '')).toEqual(
      '/1000?q=1234'
    );
    expect(
      router.createUrl('main', { page: '1000', q: '1234' }, 'anchor')
    ).toEqual('/1000?q=1234#anchor');

    router
      .renderResult()
      .pipe(first())
      .subscribe(
        renderResult => {
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
        },
        undefined,
        () => {
          expect(router.isActive('main')).toEqual(true);
          expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
            true
          );
          expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
            true
          );
          expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(
            false
          );
          expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(
            false
          );
          router.stop();
          done();
        }
      );
    router.start();
  });

  it('navigates', done => {
    const history = createTestHistory('/123?q=text#anchor');

    let hashChangeCount = 0;
    const router: TestRouter = new Router(
      createTestConfig(
        {
          routeCollection: new RouteCollection([
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
          ]),
          history,
        },
        {
          onHashChange(location: Location) {
            if (hashChangeCount === 0) {
              // router.navigate
              expect(location).toEqual({
                pathname: '/123',
                search: 'q=text',
                hash: 'anc',
                state: {},
                source: 'push',
              });
            }
            if (hashChangeCount === 1) {
              // onpopstate
              expect(location).toEqual({
                pathname: '/123',
                search: 'q=text',
                hash: 'anc2',
                state: {},
                source: 'pop',
              });
            }
            hashChangeCount += 1;
          },
        }
      )
    );

    let count = 0;

    router
      .renderResult()
      .pipe(take(3))
      .subscribe(
        renderResult => {
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
            expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
              true
            );
            expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
              true
            );
            expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(
              false
            );
            expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(
              false
            );
          }

          if (count === 1) {
            expect(renderResult.route).toEqual('main1');
            expect(renderResult.params).toEqual({ page: '123', q: false });
            expect(renderResult.handlers).toEqual(['main1']);
            expect(renderResult.location).toEqual({
              pathname: '/m2/123',
              search: '',
              hash: '',
              state: {},
              source: 'push',
            });

            expect(router.isActive('main1')).toEqual(true);
            expect(router.isActive('main1', { page: '123' })).toEqual(true);
            expect(router.isActive('main1', { page: '123', q: false })).toEqual(
              true
            );
            expect(router.isActive('main1', { page: '123', q: 'tex' })).toEqual(
              false
            );
            expect(router.isActive('main1', { page: '12', q: 'text' })).toEqual(
              false
            );
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
            expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
              true
            );
            expect(router.isActive('main', { page: '123', q: 'text' })).toEqual(
              true
            );
            expect(router.isActive('main', { page: '123', q: 'tex' })).toEqual(
              false
            );
            expect(router.isActive('main', { page: '12', q: 'text' })).toEqual(
              false
            );
          }
          if (count === 3) {
            expect(renderResult.route).toEqual('main');
            expect(renderResult.params).toEqual({ page: '123', q: 'text' });
            expect(renderResult.handlers).toEqual(['main']);
            expect(renderResult.location).toEqual({
              pathname: '/123',
              search: '',
              hash: '',
              state: {},
              source: 'push',
            });

            expect(router.isActive('main')).toEqual(true);
          }
          count += 1;
        },
        undefined,
        () => {
          router.stop();
          done();
        }
      );
    setTimeout(() => {
      router.navigate('main', { page: '123', q: 'text' }, 'anc');
      history.navigate('/123?q=text#anc2', {});
      router.navigate('main1', { page: '123' });
      router.navigate('main', { page: '123', q: 'text' }, 'anc', { a: true });
      router.navigateToUrl('/123');
    }, 10);

    router.start();
  });

  it('uses onBeforeUnload', done => {
    let historyChange: any;
    const history = createTestHistory('/', (...v) => {
      historyChange = v;
    });

    let count = 0;
    // @ts-ignore
    global.confirm = txt => {
      count += 1;
      return txt === 'yes';
    };

    let answer = 'no';

    const testHandlerOptions = {
      onBeforeUnload: () => answer,
    };
    const router: TestRouter = new Router(
      createTestConfig(
        {
          routeCollection: new RouteCollection([
            {
              name: 'main',
              handler: 'main',
              url: '/',
            },
            {
              name: 'main2',
              handler: 'main2',
              url: '/2',
            },
          ]),
          history,
        },
        testHandlerOptions
      )
    );

    router.start();

    setTimeout(() => {
      expect(count).toEqual(0);
      answer = 'no';
      router.navigate('main2');
    }, 20);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      expect(count).toEqual(1);
      answer = 'no';
      history.navigate('/2');
    }, 40);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      expect(count).toEqual(2);
      expect(historyChange).toEqual([
        'push',
        { url: '/', state: {}, title: null },
      ]);
      answer = 'yes';
      history.navigate('/2');
    }, 60);

    setTimeout(() => {
      expect(router.isActive('main2')).toEqual(true);
      expect(count).toEqual(3);
      answer = 'yes';
      router.navigate('main', {});
    }, 80);

    setTimeout(() => {
      expect(router.isActive('main')).toEqual(true);
      expect(count).toEqual(4);
      expect(historyChange).toEqual([
        'push',
        { url: '/', state: {}, title: null },
      ]);
      router.stop();
      done();
    }, 100);
  });

  it('handles transition.forward calls', done => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection<any>([
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: (t: any) => t.forward('/3'),
          url: '/2',
        },
        {
          name: 'main3',
          handler: () => 'main3',
          url: '/3',
        },
        {
          name: 'main4',
          handler: (t: any) =>
            t.location.hash === '' ? t.forward('/4#123') : '',
          url: '/4',
        },
      ]),
      history,
      loadState() {
        return of({
          onHashChange: noop,
          onBeforeUnload: () => '',
        });
      },
      renderState(state, transition) {
        return of(transition.route.handlers[0](transition));
      },
    });
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

    router.start();
  });

  it('crashes when transition.forward navigates to same page', done => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection<any>([
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: (t: any) => t.forward('/2') || '',
          url: '/2',
        },
      ]),
      history,
      loadState() {
        return of({
          onHashChange: noop,
          onBeforeUnload: () => '',
        });
      },
      renderState(state, transition) {
        return of(transition.route.handlers[0](transition));
      },
    });

    let hasError = false;
    router.renderResult().subscribe(undefined, () => {
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
    router.start();
  });

  it('crashes when transition.forward calls cause redirect loop', done => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection<any>([
        {
          name: 'main',
          handler: () => 'main',
          url: '/',
        },
        {
          name: 'main2',
          handler: (t: any) => t.forward('/3'),
          url: '/2',
        },
        {
          name: 'main3',
          handler: (t: any) => t.forward('/2'),
          url: '/3',
        },
      ]),
      history,
      loadState() {
        return of({
          onHashChange: noop,
          onBeforeUnload: () => '',
        });
      },
      renderState(state, transition) {
        return of(transition.route.handlers[0](transition));
      },
    });

    let hasError = false;
    router.renderResult().subscribe(undefined, () => {
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
    }, 50);
    router.start();
  });

  it('pass render exception to observer', done => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection([
        {
          name: 'main',
          handler: () => 'main' as any,
          url: '/',
        },
      ]),
      history,
      loadState() {
        return of({
          onHashChange: noop,
          onBeforeUnload: () => '',
        });
      },
      renderState() {
        throw new Error('state rendering failed');
      },
    });

    let hasError = false;
    router.renderResult().subscribe(undefined, () => {
      hasError = true;
    });

    setTimeout(() => {
      expect(hasError).toEqual(true);
      router.stop();
      done();
    }, 50);
    router.start();
  });

  it('logs exception if not observer for it', done => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection([
        {
          name: 'main',
          handler: () => 'main' as any,
          url: '/',
        },
      ]),
      history,
      loadState() {
        return of({
          onHashChange: noop,
          onBeforeUnload: () => '',
        });
      },
      renderState() {
        throw new Error('state rendering failed');
      },
    });

    jest.spyOn(console, 'error').mockImplementationOnce(v => {
      expect(v).toMatchSnapshot();
      router.stop();
      done();
    });
    router.start();
  });

  it('loads next matched route if first is not loaded', () => {
    const history = createTestHistory('/');

    const router: TestRouter = new Router({
      routeCollection: new RouteCollection<any>([
        {
          name: 'main1',
          handler: () => false,
          url: '/',
        },
        {
          name: 'main2',
          handler: () => false,
          url: '/',
        },
        {
          name: 'main3',
          handler: () => 'main',
          url: '/',
        },
      ]),
      history,
      loadState(transition) {
        return of(
          transition.route.handlers[0]()
            ? {
                onHashChange: noop,
                onBeforeUnload: () => '',
              }
            : false
        );
      },
      renderState() {
        return of({});
      },
    });

    router.start();
    expect(router.isActive('main3')).toEqual(true);
    router.stop();
  });
});
