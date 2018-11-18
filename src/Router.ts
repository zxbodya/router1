import { EMPTY, merge, noop, Observable, of, Subject } from 'rxjs';

import { map, mergeMap, switchMap } from 'rxjs/operators';

import { Subscriber, Subscription } from 'rxjs';

import { History, Location, NavigateSource } from './history/history';
import { Route } from './routes/compileRoutes';
import { RouteCollection } from './routes/RouteCollection';

import {
  generate as generateQuery,
  parse as parseQuery,
} from './utils/queryString';

import { normalizeParams } from './routes/normalizeParams';
import { OnLocationChange, StateHandler } from './StateHandler';

export interface Transition<RouteState, RenderResult, RouteHandler> {
  location: Location;
  // eslint-disable-next-line no-use-before-define
  router: Router<RouteState, RenderResult, RouteHandler>;
  redirectCount: number;
  forward: (redirectUrl: string) => void;
}

export interface RouteParams {
  [key: string]: string | boolean;
}
export type RouteTransition<
  RouteState,
  RenderResult,
  RouteHandler
> = Transition<RouteState, RenderResult, RouteHandler> & {
  route: Route<RouteHandler>;
  params: RouteParams;
};

type StateLoader<RouteState, RenderResult, RouteHandler> = ((
  routeTransition: RouteTransition<RouteState, RenderResult, RouteHandler>
) => Observable<RouteState>);

export type AfterRender<RouteState, RenderResult, RouteHandler> = (
  stateHandler: StateHandler<RouteState, RenderResult, RouteHandler>,
  pageState: {
    state: RouteState;
    transition: Transition<RouteState, RenderResult, RouteHandler>;
    renderResult: RenderResult;
  }
) => void;

export interface RouterConfig<RouteState, RenderResult, RouteHandler> {
  history: History;
  routeCollection: RouteCollection<RouteHandler>;
  loadState: StateLoader<RouteState, RenderResult, RouteHandler>;
  onHashChange?: OnLocationChange;
  renderState: (
    state: RouteState,
    transition: RouteTransition<RouteState, RenderResult, RouteHandler>
  ) => Observable<RenderResult>;
  onLocationChange?: OnLocationChange;
}

export type RenderState<RouteState, RenderResult, RouteHandler> = (
  state: RouteState,
  routeTransition: RouteTransition<RouteState, RenderResult, RouteHandler>
) => Observable<RenderResult>;

export class Router<RouteState, RenderResult, RouteHandler> {
  private readonly history: History;

  private readonly routeCollection: RouteCollection<RouteHandler>;

  public activeRoute: [
    string,
    RouteParams,
    StateHandler<RouteState, RenderResult, RouteHandler> | null
  ] = ['', {}, null];
  public currentLocation: Location = {
    pathname: '',
    search: '',
    hash: '',
    state: null,
  };

  private resultsSubscription?: Subscription = undefined;

  private readonly renderResult$: Subject<RenderResult> = new Subject();

  private readonly loadState: StateLoader<
    RouteState,
    RenderResult,
    RouteHandler
  >;

  private readonly onHashChange: OnLocationChange;

  private readonly renderState: RenderState<
    RouteState,
    RenderResult,
    RouteHandler
  >;

  private readonly onLocationChange: OnLocationChange;

  private readonly navigate$: Subject<{
    url: string;
    state?: object;
    source: NavigateSource;
  }> = new Subject();

  public onBeforeUnload = (e?: BeforeUnloadEvent): string | void => {
    const returnValue = this.activeRoute[2]
      ? this.activeRoute[2].onBeforeUnload()
      : '';
    if (e && returnValue) {
      e.returnValue = returnValue;
    }
    return returnValue || undefined;
  };

  constructor(config: RouterConfig<RouteState, RenderResult, RouteHandler>) {
    this.history = config.history;
    this.routeCollection = config.routeCollection;
    this.loadState = config.loadState;
    this.onHashChange = config.onHashChange || noop;
    this.renderState = config.renderState;
    this.onLocationChange = config.onLocationChange || noop;
  }

  private createHandler(
    transition: Transition<RouteState, RenderResult, RouteHandler> & {
      route: Route<RouteHandler>;
      params: RouteParams;
    }
  ): Observable<StateHandler<RouteState, RenderResult, RouteHandler> | null> {
    const state$ = this.loadState(transition);
    return state$.pipe(
      map(
        state =>
          state
            ? new StateHandler(
                state,
                transition,
                this.onHashChange,
                this.renderState,
                this.onLocationChange
              )
            : null
      )
    );
  }

  private createNotFoundHandler(
    transition: Transition<RouteState, RenderResult, RouteHandler>
  ): Observable<StateHandler<RouteState, RenderResult, RouteHandler>> {
    const notFoundTransition = {
      // @ts-ignore
      route: {
        name: '',
        handlers: [],
      } as Route<RouteHandler>,
      params: {},
      ...transition,
      router: this,
    };
    const state$ = this.loadState(notFoundTransition);
    return state$.pipe(
      map(
        state =>
          new StateHandler(
            state,
            notFoundTransition,
            this.onHashChange,
            this.renderState,
            this.onLocationChange
          )
      )
    );
  }

  public start(): void {
    const transitionFromLocation = (
      toLocation: Location
    ): Observable<Transition<RouteState, RenderResult, RouteHandler>> =>
      Observable.create(
        (
          observer: Subscriber<
            Transition<RouteState, RenderResult, RouteHandler>
          >
        ) => {
          let redirectCount = 0;
          let forwardInt: (url: string) => void;
          // defer redirect to new state to prevent subscription new render() result before old in edge cases
          const forward = (redirectUrl: string) => {
            setTimeout(forwardInt, 0, redirectUrl);
          };
          forwardInt = (redirectUrl: string): void => {
            if (redirectCount > 20) {
              observer.error(Error('To many redirects!'));
            }

            this.history.replace(redirectUrl);

            const location: Location = {
              ...this.history.parseUrl(redirectUrl),
              source: 'replace',
              state: {},
            };

            if (
              this.currentLocation.pathname === location.pathname &&
              this.currentLocation.search === location.search
            ) {
              if (this.currentLocation.hash === location.hash) {
                observer.error(Error('Redirect to the same location!'));
              }
              if (this.activeRoute[2]) {
                this.activeRoute[2].onHashChange(location);
              }
              this.currentLocation = location;
            } else {
              this.currentLocation = location;

              redirectCount += 1;
              observer.next({
                location,
                router: this,
                redirectCount,
                forward,
              });
            }
          };
          observer.next({
            location: toLocation,
            router: this,
            redirectCount,
            forward,
          });
        }
      );

    const historyTransition$: Observable<Location> = this.history.location.pipe(
      mergeMap((location: Location) => {
        if (
          this.currentLocation.pathname === location.pathname &&
          this.currentLocation.search === location.search
        ) {
          if (this.activeRoute[2]) {
            this.activeRoute[2].onHashChange(location);
          }
          this.currentLocation = location;
          return EMPTY;
        }

        const beforeUnload = this.onBeforeUnload();
        // eslint-disable-next-line no-restricted-globals,no-alert
        const cancelTransition = beforeUnload && !confirm(beforeUnload);
        if (cancelTransition) {
          // case when user navigates back or forward, but transition was canceled
          this.history.push(
            this.history.createUrl(
              this.currentLocation.pathname,
              this.currentLocation.search,
              this.currentLocation.hash
            ),
            this.currentLocation.state
          );
          return EMPTY;
        }

        this.currentLocation = location;
        return [location];
      })
    );

    const navigateTransition$: Observable<Location> = this.navigate$.pipe(
      mergeMap(({ url, state, source }) => {
        const location = {
          ...this.history.parseUrl(url),
          source,
          state,
        };

        if (
          this.currentLocation.pathname === location.pathname &&
          this.currentLocation.search === location.search
        ) {
          if (this.activeRoute[2]) {
            this.activeRoute[2].onHashChange(location);
          }
          this.currentLocation = location;
          this.history.push(url, state);
          return EMPTY;
        }

        const beforeUnload = this.onBeforeUnload();
        // eslint-disable-next-line no-restricted-globals,no-alert
        const cancelTransition = beforeUnload && !confirm(beforeUnload);

        if (cancelTransition) {
          return EMPTY;
        }

        this.currentLocation = location;
        this.history.push(url, state);

        return [location];
      })
    );
    const matchRoutes = (
      transition: Transition<RouteState, RenderResult, RouteHandler>
    ): Transition<RouteState, RenderResult, RouteHandler> & {
      routes: Array<[Route<RouteHandler>, RouteParams]>;
    } => ({
      ...transition,
      routes: this.routeCollection.match(
        transition.location.pathname,
        parseQuery(transition.location.search)
      ),
    });

    const loadMatched = (
      transition: Transition<RouteState, RenderResult, RouteHandler> & {
        routes: Array<[Route<RouteHandler>, RouteParams]>;
      }
    ): Observable<
      [
        string,
        RouteParams,
        StateHandler<RouteState, RenderResult, RouteHandler>
      ]
    > => {
      const loadRoute = (
        routes: Array<[Route<RouteHandler>, RouteParams]>,
        index: number
      ): Observable<
        [
          string,
          RouteParams,
          StateHandler<RouteState, RenderResult, RouteHandler> | null
        ]
      > => {
        if (index >= routes.length) {
          // not found
          return of(['', {}, null]) as Observable<
            [
              string,
              RouteParams,
              StateHandler<RouteState, RenderResult, RouteHandler>
            ]
          >;
        }

        const route = routes[index];
        const handler = this.createHandler({
          route: route[0],
          params: route[1],
          ...transition,
        } as Transition<RouteState, RenderResult, RouteHandler> & { route: any; params: any });
        return handler.pipe(
          switchMap(
            loadResult =>
              loadResult
                ? (of([route[0].name, route[1], loadResult]) as Observable<
                    [
                      string,
                      RouteParams,
                      StateHandler<
                        RouteState,
                        RenderResult,
                        RouteHandler
                      > | null
                    ]
                  >)
                : loadRoute(routes, index + 1)
          )
        );
      };

      return loadRoute(transition.routes, 0).pipe(
        mergeMap(
          ([routeName, routeParams, handler]) =>
            (handler
              ? of([routeName, routeParams, handler])
              : this.createNotFoundHandler(transition).pipe(
                  map(v => [routeName, routeParams, v])
                )) as Observable<
              [
                string,
                RouteParams,
                StateHandler<RouteState, RenderResult, RouteHandler>
              ]
            >
        )
      );
    };

    const activateLoaded = ([route, params, handler]: [
      string,
      RouteParams,
      StateHandler<RouteState, RenderResult, RouteHandler>
    ]): Observable<RenderResult> => {
      this.activeRoute = [route, params, handler];
      // @ts-ignore
      return this.activeRoute[2].render();
    };

    this.resultsSubscription = merge(historyTransition$, navigateTransition$)
      .pipe(
        switchMap(transitionFromLocation),
        // transition handling
        map(matchRoutes),
        switchMap(loadMatched),
        switchMap(activateLoaded)
      )
      .subscribe(
        v => {
          this.renderResult$.next(v);
        },
        e => {
          if (this.renderResult$.observers.length) {
            this.renderResult$.error(e);
          } else {
            // tslint:disable-next-line no-console
            console.error(e);
          }
        }
      );
  }

  public stop(): void {
    if (this.resultsSubscription) {
      this.resultsSubscription.unsubscribe();
    }
  }

  public renderResult(): Observable<RenderResult> {
    return this.renderResult$.asObservable();
  }

  public isActive(route: string, params: RouteParams = {}): boolean {
    const [activeRoute, activeRouteParams] = this.activeRoute;
    if (!activeRoute || activeRoute.substr(0, route.length) !== route) {
      return false;
    }

    let paramName;

    const activeRouteInstance = this.routeCollection.getByName(activeRoute);
    const normalizedParams = normalizeParams(
      activeRouteInstance ? activeRouteInstance.searchParams : [],
      params
    );
    for (paramName in normalizedParams) {
      if (
        Object.prototype.hasOwnProperty.call(normalizedParams, paramName) &&
        normalizedParams[paramName] !== activeRouteParams[paramName]
      ) {
        return false;
      }
    }
    return true;
  }

  public createUrl(
    name: string,
    params: RouteParams = {},
    hash: string = ''
  ): string {
    const route = this.routeCollection.getByName(name);
    if (route) {
      const pathname = route.generatePath({
        ...this.activeRoute[1],
        ...params,
      });
      const search = generateQuery(params, route.searchParams);
      return this.history.createUrl(pathname, search, hash);
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // tslint:disable-next-line no-console
      console.error(`Route "${name}" not found`);
      return `#route-${name}-not-found`;
    }
    return '#';
  }

  public navigate(
    route: string,
    params: RouteParams = {},
    hash: string = '',
    state: object = {},
    source: NavigateSource = 'push'
  ): void {
    const url = this.createUrl(route, params, hash);
    this.navigateToUrl(url, state, source);
  }

  public navigateToUrl(
    url: string,
    state: object = {},
    source: NavigateSource = 'push'
  ): void {
    this.navigate$.next({ url, state, source });
  }
}
