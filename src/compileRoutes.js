import { compile } from './expressions/compile';
import { createGenerator } from './expressions/createGenerator';
import { createMatcher } from './expressions/createMatcher';

import { concat } from './expressions/concat';

function parseRoutes(routeDefs) {
  if (process.env.NODE_ENV !== 'production') {
    const usedNames = new Set();
    for (let i = 0, l = routeDefs.length; i < l; i += 1) {
      const routeDef = routeDefs[i];
      if (usedNames.has(routeDef.name || '')) {
        throw new Error('route names should be uniq');
      }
      usedNames.add(routeDef.name || '');
    }
  }

  const rawRoutes = [];

  for (let i = 0, l = routeDefs.length; i < l; i += 1) {
    const routeDef = routeDefs[i];

    const urlParts = (routeDef.url || '').match(/^([^?]*)(?:\?(.*))?$/);

    const pathExpression = compile(urlParts[1]);
    const searchParams = urlParts[2] ? urlParts[2].split('&') : [];

    // todo: warning if query param is overridden by search param
    // todo: warning if param is duplicated

    if (routeDef.routes) {
      const nestedRoutes = parseRoutes(routeDef.routes);
      for (let ni = 0, nl = nestedRoutes.length; ni < nl; ni += 1) {
        const nestedRoute = nestedRoutes[ni];
        let handlers;
        if (routeDef.handlers) {
          handlers = [...routeDef.handlers, ...nestedRoute.handlers];
        } else {
          handlers = routeDef.handler
            ? [routeDef.handler, ...nestedRoute.handlers]
            : nestedRoute.handlers;
        }

        rawRoutes.push({
          names: [routeDef.name, ...nestedRoute.names],
          handlers,
          pathExpressions: [pathExpression, ...nestedRoute.pathExpressions],
          searchParams: [...searchParams, ...nestedRoute.searchParams],
        });
      }
    } else {
      rawRoutes.push({
        names: [routeDef.name],
        handlers:
          routeDef.handlers || (routeDef.handler ? [routeDef.handler] : []),
        pathExpressions: [pathExpression],
        searchParams,
      });
    }
  }
  return rawRoutes;
}

export function compileRoutes(routeDefs) {
  return parseRoutes(routeDefs).map(routeDef => {
    const name = routeDef.names.filter(v => v).join('.');

    if (process.env.NODE_ENV !== 'production') {
      if (routeDef.handlers.length === 0) {
        throw new Error(`route "${name}"should have at least one handler`);
      }
    }

    const pathExpression = concat(routeDef.pathExpressions);

    return {
      name,
      handlers: routeDef.handlers,
      matchPath: createMatcher(pathExpression),
      generatePath: createGenerator(pathExpression),
      searchParams: routeDef.searchParams,
    };
  });
}
