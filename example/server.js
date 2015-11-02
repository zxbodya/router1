import React from 'react';
import ReactDOM from 'react-dom/server';

import createServerHistory from './../router/createServerHistory';

import notFoundHandler from '../notFoundPage/notFoundHandler';

import routes from '../routes';
import Router from '../router/Router';
import RouterContext from '../router/RouterContext';

export default function prerender(requestPath, cb) {


  let history = createServerHistory(requestPath);

  const router = new Router(
    history,
    routes);

  router.routingResult().first().subscribe(routingResult=> {
    let handler = routingResult.handler || notFoundHandler;

    const {meta, view} = handler();

    const html = ReactDOM.renderToString(<RouterContext router={router} component={view}/>);
    cb(null, {html, meta});
  });

  //const router = Router.create({
  //  routes: routes,
  //  location: requestPath,
  //  onAbort: function (redirect) {
  //    cb({redirect: redirect.to});
  //  },
  //  onError: function (err) {
  //    cb(err);
  //  }
  //});

}
