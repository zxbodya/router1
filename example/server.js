import React from 'react';
import ReactDOM from 'react-dom/server';

import createServerHistory from './../router/createServerHistory';

import notFoundHandler from '../notFoundPage/notFoundHandler';

import routes from '../routes';
import Router from '../router/Router';
import RouterContext from '../router/RouterContext';

import toObservable from '../utils/toObservable';

export default function prerender(requestPath, cb) {


  let history = createServerHistory(requestPath);

  const router = new Router(
    history,
    routes);

  let resultMeta;
  router.routingResult()
    .flatMap(routingResult=> {
      let handler = routingResult.handler || notFoundHandler;

      return toObservable(handler(routingResult.params));
    })
    .do(({meta})=> {
      resultMeta = meta;
    })
    .flatMapLatest(({view})=>view)
    .first()
    .forEach(({component, props})=> {
      const html = ReactDOM.renderToString(
        <RouterContext router={router} component={component} props={props}/>
      );
      cb(null, {html, meta: resultMeta});
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
