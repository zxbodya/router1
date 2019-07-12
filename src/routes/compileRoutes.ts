import { compile } from '../expressions/compile';
import { createGenerator } from '../expressions/createGenerator';
import { createMatcher } from '../expressions/createMatcher';

import { concat } from '../expressions/concat';
import { normalizeParams } from './normalizeParams';

import { Expresssion } from '../expressions/compile';
import { RouteParams } from '../Router';

export interface RouteDef<RouteHandler> {
  name?: string;
  url?: string;
  handler?: RouteHandler;
  handlers?: RouteHandler[];
  routes?: Array<RouteDef<RouteHandler>>;
}

interface RawRouteDef<RouteHandler> {
  names: Array<string | null | void>;
  handlers: RouteHandler[];
  pathExpressions: Expresssion[];
  searchParams: string[];
}

function parseRoutes<RouteHandler>(
  routeDefs: Array<RouteDef<RouteHandler>>
): Array<RawRouteDef<RouteHandler>> {
  const rawRoutes = [] as Array<RawRouteDef<RouteHandler>>;

  for (let i = 0, l = routeDefs.length; i < l; i += 1) {
    const routeDef = routeDefs[i];

    const urlParts = (routeDef.url || '').match(/^([^?]*)(?:\?(.*))?$/) as [
      string,
      string,
      string
    ];

    const pathExpression = compile(urlParts[1]);
    const searchParams = urlParts[2] ? urlParts[2].split('&') : [];

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

function getRouteName<RouteHandler>(routeDef: RawRouteDef<RouteHandler>) {
  return routeDef.names.filter(v => v).join('.');
}

export interface Route<RouteHandler> {
  name: string;
  handlers: RouteHandler[];
  matchPath: (path: string) => RouteParams | null;
  generatePath: (params: RouteParams) => string;
  searchParams: string[];
}

export function compileRoutes<RouteHandler>(
  routeDefs: Array<RouteDef<RouteHandler>>
): Array<Route<RouteHandler>> {
  const rawRoutes = parseRoutes(routeDefs);
  /* istanbul ignore else */
  if (process.env.NODE_ENV !== 'production') {
    const usedNames = new Set();
    for (let i = 0, l = rawRoutes.length; i < l; i += 1) {
      const rawRoute = rawRoutes[i];
      const routeName = getRouteName(rawRoute);
      const pathExpression = concat(rawRoute.pathExpressions);

      // few routes with same name
      if (usedNames.has(routeName)) {
        console.warn(
          `"${routeName}" is dublicated, route names should be uniq`
        );
      }
      usedNames.add(routeName);

      // no handlers defined
      if (rawRoute.handlers.length === 0) {
        console.warn(`route "${routeName}" have no handlers`);
      }

      const { searchParams } = rawRoute;
      const pathParams = pathExpression[2];

      // if param is duplicated
      const pathParamsSet = new Set();
      for (let j = 0, sl = pathParams.length; j < sl; j += 1) {
        const paramName = pathParams[j];
        if (pathParamsSet.has(paramName)) {
          console.warn(
            `path param "${paramName}" in route "${routeName}" is duplicated`
          );
        }
        pathParamsSet.add(paramName);
      }

      // path param is overridden by search param
      for (let j = 0, sl = searchParams.length; j < sl; j += 1) {
        const paramName = searchParams[j];
        if (pathParamsSet.has(paramName)) {
          console.warn(
            `path param "${paramName}" in route "${routeName}" is overridden by search params`
          );
        }
      }
    }
  }
  return rawRoutes.map(rawRoute => {
    const routeName = getRouteName(rawRoute);
    const pathExpression = concat(rawRoute.pathExpressions);

    const matchPath = createMatcher(pathExpression);
    let generatePath = createGenerator(pathExpression);
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const generatePathOriginal = generatePath;
      // test if matcher can match the result, and warn if not
      generatePath = params => {
        const normalizedParams = normalizeParams(rawRoute.searchParams, params);
        const path = generatePathOriginal(params);
        const match = matchPath(path);
        if (!match) {
          console.warn(
            `path "${path}" generated for route "${routeName}" with params ${JSON.stringify(
              params
            )}, is not matched by same route`
          );
        } else if (
          Object.keys(match).reduce(
            (acc, k) => acc || normalizedParams[k] !== match[k],
            false
          )
        ) {
          console.warn(
            `path "${path}" generated for route "${routeName}" with params ${JSON.stringify(
              params
            )}, is matched by same route with different params ${JSON.stringify(
              match
            )}`
          );
        }
        return path;
      };
    }
    return {
      name: routeName,
      handlers: rawRoute.handlers,
      matchPath,
      generatePath,
      searchParams: rawRoute.searchParams,
    };
  });
}
