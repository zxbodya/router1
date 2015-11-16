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
const router = new Router(
  history,
  routes);

const doScroll = (time)=> {
  const hash = window.location.hash;
  if (hash) {
    let target = $(hash);
    target = target.length ? target : $('[name=' + hash.slice(1) + ']');
    if (target.length) {
      $('html,body').animate({
        scrollTop: target.offset().top,
      }, time);
    }
  } else {
    $('html,body').animate({
      scrollTop: 0,
    }, time);
  }
};

const renderObservable = Observable.fromCallback(ReactDOM.render);
const appElement = document.getElementById('app');
router
  .routingResult()
  .flatMap(routingResult=> {
    const handler = routingResult.handler || notFoundHandler;

    return toObservable(handler(routingResult.params));
  })
  .do(({meta, redirect})=> {
    if (redirect) {
      history.replace(redirect);
    } else {
      document.title = meta.title || '';

      $('meta[name=description]').text(meta.description || '');
    }
  })
  .filter(({redirect})=>!redirect)
  .flatMapLatest(({view})=>view)
  .flatMap(({component, props})=> {
    return renderObservable(
      <RouterContext
        router={router}
        component={component}
        props={props}/>,
      appElement
    );
  })
  .forEach(()=> {
    console.log('pageview', window.location.pathname);
    window.ga('send', 'pageview', window.location.pathname);
    doScroll(0);
  });

// .flatMap(()=> {
//  return Observable.merge(
//    // for each render
//    history.hash.first().do(()=> {
//      doScroll(0);
//    }),
//    // for all except first
//    history.hash.skip(1).do(()=> {
//      doScroll(400);
//    })
//  );
// })
