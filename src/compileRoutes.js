import compileExpression from './expressions/compile.js';
import contactExpressions from './expressions/concat.js';
import generatorFromExpression from './expressions/createGenerator.js';
import matcherFromExpression from './expressions/createMatcher.js';

function flatten(routeDefs) {
  if (process.env.NODE_ENV !== 'production') {
    let usedNames = new Set();
    for (let i = 0, l = routeDefs.length; i < l; i++) {
      let routeDef = routeDefs[i];
      if (!routeDef.name) {
        throw new Error('routes should have name property');
      }
      if (!routeDef.handler) {
        throw new Error('routes should have handler property');
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

    let urlParts = (routeDef.url || '').match(/^([^?]*)(?:\?(.*))?$/);

    let pathExpression = compileExpression(urlParts[1]);
    let searchParams = urlParts[2] ? urlParts[2].split('&') : [];

    // todo: warning if query param is overridden by search param
    // todo: warning if param is duplicated

    let part = {
      name: routeDef.name,
      handler: routeDef.handler,
      path: pathExpression,
      searchParams: searchParams
    };

    if (routeDef.routes && routeDef.routes.length > 0) {
      let nested = flatten(routeDef.routes);
      for (let ni = 0, nl = nested.length; ni < nl; ni++) {
        rawRoutes.push([part].concat(nested[ni]));
      }
    } else {
      rawRoutes.push([part]);
    }
  }
  return rawRoutes;
}

function compileRoutes(rawRoutes) {
  return flatten(rawRoutes).map(rawRoute=> {
    let rawSearchParams = rawRoute.reduce((acc, part)=> {
      acc.push(...part.searchParams);
      return acc;
    }, []);

    let searchParams = [...new Set(rawSearchParams)];
    // todo: warning if param is duplicated

    let pathExp = contactExpressions(rawRoute.map(part=>part.path));
    // todo: warning if param is duplicated
    let allParams = [...new Set([...pathExp[2], ...searchParams])];
    // todo: warning if query param is overridden by search param

    return {
      name: rawRoute.map(part=>part.name).join('/'),
      handler: rawRoute.map(part=>part.handler),
      matchPath: matcherFromExpression(pathExp),
      generatePath: generatorFromExpression(pathExp),
      searchParams,
      allParams
    }
  });
}

export default compileRoutes;
