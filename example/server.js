import React from 'react';
import Router from 'react-router';
import routes from '../routes';

export default function prerender(requestPath, cb, metaData) {

  const router = Router.create({
    routes: routes,
    location: requestPath,
    onAbort: function (redirect) {
      cb({redirect: redirect.to});
    },
    onError: function (err) {
      cb(err);
    }
  });

  router.run(function (Handler) {

    React.withContext({
      metaData: metaData
    }, ()=> {
      const virtualDom = React.createFactory(Handler)({});
      const html = React.renderToString(virtualDom);
      cb(null, html);
    });

  });
}
