import { tap } from 'rxjs/operators';

import { Observable } from 'rxjs';
import { Location } from './history/history';
import { Router, RouteTransition } from './Router';

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
  public onHashChange: OnLocationChange;
  public renderState: (
    state: RouteState,
    transition: RouteTransition<RouteState, RenderResult, RouteHandler>
  ) => Observable<RenderResult>;
  public onLocationChange: OnLocationChange;
  public onBeforeUnload: () => string;

  constructor(
    state: RouteState,
    routeTransition: RouteTransition<RouteState, RenderResult, RouteHandler>,
    onHashChange: OnLocationChange,
    renderState: (
      state: RouteState,
      transition: RouteTransition<RouteState, RenderResult, RouteHandler>
    ) => Observable<RenderResult>,
    onLocationChange: OnLocationChange
  ) {
    this.state = state;
    this.transition = routeTransition;
    this.router = routeTransition.router;
    this.onHashChange = onHashChange;
    this.renderState = renderState;
    this.onLocationChange = onLocationChange;
    // by default do not prevent transition
    this.onBeforeUnload = () => '';
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
          this.onHashChange = this.state.onHashChange;
        }
        this.onLocationChange(this.transition.location);
      })
    );
  }
}
