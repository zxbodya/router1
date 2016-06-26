import { Router } from './Router';
import { Observable } from 'rx';
import { createTestHistory } from './createTestHistory';

describe('Router', () => {
  it('works with empty route collection', (done) => {
    const history = createTestHistory('/');
    const router = new Router({
      routes: [],
      history,
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', {}, '')).toEqual('#route-main-not-found');
    expect(router.isActive('main')).toEqual(false);

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual(null);
      expect(renderResult.params).toEqual({});
      expect(renderResult.handlers).toEqual([]);
      expect(renderResult.location).toEqual({ pathname: '/', search: '', hash: '', state: {} });

      expect(router.isActive('main')).toEqual(false);
      expect(router.activeRoute).toEqual([null, {}]);
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
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', {}, '')).toEqual('/');
    expect(router.createUrl('main2', {}, '')).toEqual('#route-main2-not-found');

    router.renderResult().first().subscribe(renderResult => {
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
    const history = createTestHistory('/123');
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

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/123', search: '', hash: '', state: {} });
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
      render: (routingResult) => Observable.return(routingResult),
    });

    expect(router.createUrl('main', { page: 1000, q: 1234 }, '')).toEqual('/1000?q=1234');
    expect(router.createUrl('main', { page: 1000, q: 1234 }, 'anchor')).toEqual('/1000?q=1234#anchor');

    router.renderResult().first().subscribe(renderResult => {
      expect(renderResult.route).toEqual('main');
      expect(renderResult.params).toEqual({ page: '123', q: 'text' });
      expect(renderResult.handlers).toEqual(['main']);
      expect(renderResult.location).toEqual({ pathname: '/123', search: '?q=text', hash: '#anchor', state: {} });
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
      render: (routingResult) => Observable.return(routingResult),
    });

    let count = 0;

    router.hashChange.take(1).subscribe(location => {
      expect(location).toEqual({ pathname: '/123', search: '?q=text', hash: '#anc', state: {} });
    });

    router.renderResult().take(3).subscribe(renderResult => {
      if (count === 0) {
        expect(renderResult.route).toEqual('main');
        expect(renderResult.params).toEqual({ page: '123', q: 'text' });
        expect(renderResult.handlers).toEqual(['main']);
        expect(renderResult.location).toEqual({ pathname: '/123', search: '?q=text', hash: '#anchor', state: {} });


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
        expect(renderResult.location).toEqual({ pathname: '/m2/123', search: '', hash: '', state: {} });

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
          search: '?q=text',
          hash: '#anc',
          state: { a: true },
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
      router.navigate('main1', { page: '123' });
      router.navigate('main', { page: '123', q: 'text' }, 'anc', { a: true });
    }, 10);
  });
});
