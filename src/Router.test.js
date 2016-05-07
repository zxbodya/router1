import { Router } from './Router';
import { Observable } from 'rx';
import { createServerHistory } from './createServerHistory';

describe('Router', () => {
  it('works with empty route collection', (done) => {
    const history = createServerHistory('/');
    const router = new Router({
      routes: [],
      history,
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', {}, '')).toEqual('#route-main-not-found');

    router.renderResult().subscribe(renderResult => {
      expect(renderResult.route).toEqual(null);
      expect(renderResult.params).toEqual({});
      expect(renderResult.handlers).toEqual([]);
      expect(renderResult.location).toEqual({ pathname: '/', search: '', hash: '', state: {} });
    }, () => {
    }, () => {
      done();
    });
  });

  it('matches route', (done) => {
    const history = createServerHistory('/');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/',
      }],
      history,
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', {}, '')).toEqual('/');
    expect(router.createUrl('main2', {}, '')).toEqual('#route-main2-not-found');

    router.renderResult().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({});
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/', search: '', hash: '', state: {} });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      done();
    });
  });

  it('matches route with params', (done) => {
    const history = createServerHistory('/123');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/<page:\\d+>',
      }],
      history,
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', { page: 1000 }, '')).toEqual('/1000');

    router.renderResult().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/123', search: '', hash: '', state: {} });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      done();
    });
  });

  it('matches route with params and search query and hash', (done) => {
    const history = createServerHistory('/123?q=text#anchor');
    const router = new Router({
      routes: [{
        name: 'main',
        handler: 'main',
        url: '/<page:\\d+>?q',
      }],
      history,
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', { page: 1000, q: 1234 }, '')).toEqual('/1000?q=1234');
    expect(router.createUrl('main', { page: 1000, q: 1234 }, 'anchor')).toEqual('/1000?q=1234#anchor');

    router.renderResult().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123', q: 'text' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/123', search: '?q=text', hash: '#anchor', state: {} });
    }, () => {
    }, () => {
      expect(router.isActive('main')).toEqual(true);
      done();
    });
  });
});
