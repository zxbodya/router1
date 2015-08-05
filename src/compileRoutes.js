import compileExpression from './compileExpression';

let passHandler = (route, paramStreams, elementStreams) => elementStreams;

let compileRoutes = (routeDefs)=> {
  if (process.env.NODE_ENV !== 'production') {
    let usedNames = new Set();
    for (let i = 0, l = routeDefs.length; i < l; i++) {
      let routeDef = routeDefs[i];
      if (!routeDef.name) {
        throw new Error('routes should have name property');
      }
      if (/[\/.]/.test(routeDef.name)) {
        throw new Error('route name should not contain slashes and dots');
      }
      if (usedNames.has(routeDef.name)) {
        throw new Error('route names should be uniq');
      }
      usedNames.add(routeDef.name);
    }
  }

  let rawRoutes = [];

  for (let i = 0, l = routeDefs.length; i < l; i++) {
    let routeDef = routeDefs[i];

    let urlParts = (routeDef.url || '').match(/^([^?#]*)(?:\?([^#]*))?#?(.*)$/);
    let part = {
      name: routeDef.name,
      handler: routeDef.handler || passHandler,
      path: compileExpression(urlParts[1]),
      searchParams: urlParts[2] ? urlParts[2].split('&') : [],
      hash: compileExpression(urlParts[3]),
      slots: routeDef.slots || []
    };

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

export default compileRoutes;
