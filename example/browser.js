import React from 'react';

import ReactDOM from 'react-dom';

import {Observable} from 'rx';

import $ from 'jquery';

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

const router = new Router({
  history,
  routes,
  render: (routingResult)=> {
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

        $('meta[name=description]').text(meta.description || '');

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
          if (locationSource === 'push' || locationSource === 'replace' || locationSource === 'init') {
            // scrollto anchor position
            let target = $(locationHash);
            target = target.length ? target : $('[name=' + locationHash.slice(1) + ']');
            if (target.length) {
              $('html,body').animate({
                scrollTop: target.offset().top,
              }, 0);
            }
          }
        } else {
          if (locationSource === 'push' || locationSource === 'replace') {
            // scrollto 0,0
            $('html,body').animate({
              scrollTop: 0,
            }, 0);
          }
        }
      });
  },
});

router
  .renderResult()
  .forEach(()=> {
    console.log('pageview', window.location.pathname);
    window.ga('send', 'pageview', window.location.pathname);
  });
