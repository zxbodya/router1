import { tap } from 'rxjs/operators';

import { Observable } from 'rxjs';
import { Location } from './history/history';
import { Router, RouteTransition } from './Router';
import { IScrollBehavior } from './scroll/types';

export type OnLocationChange = (location: Location) => void;

interface BaseRouteState {
  onHashChange?: OnLocationChange;
  onBeforeUnload?: () => string;
}
export class StateHandler<
  RouteState extends BaseRouteState,
  RenderResult,
  RouteHandler
> {
  public state: RouteState;
  public transition: RouteTransition<RouteState, RenderResult, RouteHandler>;
  public router: Router<RouteState, RenderResult, RouteHandler>;
  private onHashChangeOverride?: OnLocationChange;
  public renderState: (
    state: RouteState,
    transition: RouteTransition<RouteState, RenderResult, RouteHandler>
  ) => Observable<RenderResult>;
  public onBeforeUnload: () => string;
  private readonly scrollBehavior?: IScrollBehavior;

  constructor(
    state: RouteState,
    routeTransition: RouteTransition<RouteState, RenderResult, RouteHandler>,
    renderState: (
      state: RouteState,
      transition: RouteTransition<RouteState, RenderResult, RouteHandler>
    ) => Observable<RenderResult>,
    scrollBehavior?: IScrollBehavior
  ) {
    this.state = state;
    this.transition = routeTransition;
    this.router = routeTransition.router;
    this.scrollBehavior = scrollBehavior;
    this.renderState = renderState;
    // by default do not prevent transition
    this.onBeforeUnload = () => '';
  }

  public onHashChange(location: Location): void {
    if (this.onHashChangeOverride) {
      this.onHashChangeOverride(location);
    } else {
      if (this.scrollBehavior) {
        this.scrollBehavior.onHashChange(location);
      }
    }
  }

  public render(): Observable<RenderResult> {
    return this.renderState(this.state, this.transition).pipe(
      tap(renderResult => {
        // after state was rendered
        if (this.state.onBeforeUnload) {
          // if state provides before unload hook - replace default with it
          // eslint-disable-next-line no-param-reassign
          this.onBeforeUnload = this.state.onBeforeUnload;
        }
        if (this.state.onHashChange) {
          // if state provides hash change handler - replace default with it
          // eslint-disable-next-line no-param-reassign
          this.onHashChangeOverride = this.state.onHashChange;
        }
        if (this.scrollBehavior) {
          this.scrollBehavior.onLocationChange(this.transition.location);
        }
      })
    );
  }
}
