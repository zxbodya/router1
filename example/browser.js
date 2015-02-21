import React from 'react';
import Router from 'react-router';

import routes from '../routes';
import $ from 'jquery';

import '../styles/main.sass';
import '../styles/icons.scss';

(function (i, s, o, g, r, a, m) {
  i.GoogleAnalyticsObject = r;
  i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    };
  i[r].l = Date.now();
  a = s.createElement(o);
  m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m);
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
window.ga('create', 'UA-40296016-1', 'auto');

window.gae = function (eventCategory, eventAction, eventLabel, eventValue, fieldsObject) {
  window.ga('send', 'event', eventCategory, eventAction, eventLabel, eventValue, fieldsObject);
};

Router.run(routes, Router.HistoryLocation, (Handler) => {
  React.withContext({
    metaData: {
      setTitle(title) {
        document.title = title;
      },
      setDescription(description) {
        $('meta[name=description]').text(description);
      }
    }
  }, ()=> {
    React.render(<Handler/>, document.getElementById('app'), ()=> {
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
