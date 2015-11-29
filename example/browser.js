import React from 'react';

import ReactDOM from 'react-dom';

import {Observable} from 'rx';

import '../styles/main.sass';
import '../styles/icons.scss';

import './ga';

import createBrowserHistory from './../router/createBrowserHistory';

const history = createBrowserHistory();

import notFoundHandler from '../notFoundPage/notFoundHandler';

import routes from '../routes';
import Router from '../router/Router';
import RouterContext from '../router/RouterContext';

import toObservable from '../utils/toObservable';

const renderObservable = Observable.fromCallback(ReactDOM.render);
const appElement = document.getElementById('app');

let scrollAnimationDispose = null;

const cancelScrollAnimation = ()=> {
  if (scrollAnimationDispose) {
    scrollAnimationDispose.dispose();
  }
};


const router = new Router({
  history,
  routes,
  render: (routingResult)=> {
    cancelScrollAnimation();

    const handler = routingResult.handler || notFoundHandler;

    const locationSource = routingResult.location.source;
    const locationHash = routingResult.location.hash;

    return toObservable(handler(routingResult.params))
      .flatMap(({view, meta, redirect})=> {
        if (redirect) {
          history.replace(redirect);
          return Observable.empty();
        }

        document.title = meta.title || '';

        // $('meta[name=description]').text(meta.description || '');

        return view.map(({component, props})=> {
          return renderObservable(
            <RouterContext
              router={router}
              component={component}
              props={props}/>,
            appElement
          );
        });
      })
      .do(()=> {
        if (locationHash !== '' && locationHash !== '#') {
          if (locationSource === 'push' || locationSource === 'replace') {
            // scrollto anchor position
            const target = document.getElementById(locationHash.substr(1));
            if (target) {
              setTimeout(()=> {
                window.scrollTo(0, window.pageYOffset + target.getBoundingClientRect().top);
              });
            }
          }
        } else {
          if (locationSource === 'push' || locationSource === 'replace') {
            setTimeout(()=> {
              window.scrollTo(0, 0);
            });
          }
        }
      });
  },
});

function animateScroll(top) {
  const duration = 400;
  const startTime = Date.now();
  const startTop = window.pageYOffset;
  let cancel = false;

  return Observable.create((observer)=> {
    let id;
    const animate = ()=> {
      if (cancel) return;
      const elapsed = Date.now() - startTime;
      if (duration <= elapsed) {
        window.scrollTo(0, top);
        observer.onCompleted();
      } else {
        const ratio = elapsed / duration;
        window.scrollTo(0, startTop * (1 - ratio) + top * ratio);
        id = window.requestAnimationFrame(animate);
      }
    };

    animate();
    return ()=> {
      cancel = true;
      window.cancelAnimationFrame(id);
    };
  });
}

router.hashChange.forEach(({hash, source})=> {
  cancelScrollAnimation();
  if (source !== 'push' && source !== 'replace') return;
  const target = document.getElementById(hash.substr(1));
  if (target) {
    scrollAnimationDispose = animateScroll(window.pageYOffset + target.getBoundingClientRect().top)
      .takeUntil(Observable.fromEvent(window, 'wheel'))
      .subscribe();
  }
});

router
  .renderResult()
  .forEach(()=> {
    window.ga('send', 'pageview', window.location.pathname);
  });
