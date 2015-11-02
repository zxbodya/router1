import React from 'react';

import ReactDOM from 'react-dom';

import $ from 'jquery';

import '../styles/main.sass';
import '../styles/icons.scss';

import './ga';

import createBrowserHistory from './../router/createBrowserHistory';

let history = createBrowserHistory();

import notFoundHandler from '../notFoundPage/notFoundHandler';

import routes from '../routes';
import Router from '../router/Router';
import RouterContext from '../router/RouterContext';

const router = new Router(
  history,
  routes);

router.routingResult().forEach(routingResult=> {
  let handler = routingResult.handler || notFoundHandler;

  const {meta, view} = handler();


  document.title = meta.title || '';

  $('meta[name=description]').text(meta.description || '');

  ReactDOM.render(<RouterContext router={router} component={view}/>, document.getElementById('app'), ()=> {
    const hash = window.location.hash;
    if (hash) {
      let target = $(hash);
      target = target.length ? target : $('[name=' + hash.slice(1) + ']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 0);
      }
    }
    window.ga('send', 'pageview', window.location.pathname);
  });
});


//////////// Performs a smooth page scroll to an anchor on the same page. ////////////

$(function () {
  $(document.body).on('click', 'a[href*=#]:not([href=#])', function () {
    if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {
      let target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 400);
        //return false;
      }
    }
  });
});
