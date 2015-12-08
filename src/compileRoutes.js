import compile from './expressions/compile.js';
import createGenerator from './expressions/createGenerator.js';
import createMatcher from './expressions/createMatcher.js';

function compileRoutes(routeDefs) {
  if (process.env.NODE_ENV !== 'production') {
    const usedNames = new Set();
    for (let i = 0, l = routeDefs.length; i < l; i++) {
      const routeDef = routeDefs[i];
      if (!routeDef.name) {
        throw new Error('routes should have name property');
      }
      if (!routeDef.handler) {
        throw new Error('routes should have handler property');
      }
      if (usedNames.has(routeDef.name)) {
        throw new Error('route names should be uniq');
      }
      usedNames.add(routeDef.name);
    }
  }

  const rawRoutes = [];

  for (let i = 0, l = routeDefs.length; i < l; i++) {
    const routeDef = routeDefs[i];

    const urlParts = (routeDef.url || '').match(/^([^?]*)(?:\?(.*))?$/);

    const pathExpression = compile(urlParts[1]);
    const searchParams = urlParts[2] ? urlParts[2].split('&') : [];

    // todo: warning if query param is overridden by search param
    // todo: warning if param is duplicated

    rawRoutes.push({
      name: routeDef.name,
      handler: routeDef.handler,
      matchPath: createMatcher(pathExpression),
      generatePath: createGenerator(pathExpression),
      searchParams: searchParams,
    });
  }
  return rawRoutes;
}

export default compileRoutes;
