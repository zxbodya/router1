const compileExpression = require('./compileExpression');

let passHandler = (route, paramStreams, elementStreams)=>elementStreams;

//todo: write spec

//  let routes = [
//    {
//      name: 'routeName',
//      // part of patch matched by route
//      // search params to pull
//      // expression for hash generation
//      url: 'path-expression?param1&param2&param3#hash-expression',
//      //resolve: {name:(params)=>{/*Promise||value*/}},
//      //hash handler: scroll, animated scroll, none
//      handler(route, paramStreams, elementStreams) {
//        /* element streams */
//      },
//      // nested routes
//      routes: []
//    }
//  ];

let compileRoutes = (routeDefs)=> {
  //todo: verify route definitions in dev

  let rawRoutes = [];

  for (let i = 0, l = routeDefs.length; i < l; i++) {
    let routeDef = routeDefs[i];

    let part = {
      name: routeDef.name,
      handler: routeDef.handler || passHandler
    };
    let urlParts = routeDef.url.match(/^([^?#]*)(?:\?([^#]*))?#?(.*)$/);
    if (!urlParts) {
      // todo: throw in development
    }
    part.path = compileExpression(urlParts[1]);
    part.searchParams = urlParts[2] ? urlParts[2].split('&') : [];
    part.hash = compileExpression(urlParts[3]);

    if (routeDef.routes && routeDef.routes.length > 0) {
      let nested = compileRoutes(routeDef.routes);
      for (let ni = 0, nl = nested.length; ni < nl; ni++) {
        rawRoutes.push([part].concat(nested[ni]));
      }
    } else {
      rawRoutes.push([part]);
    }

  }
  return rawRoutes;
};

module.exports = compileRoutes;
