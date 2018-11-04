import { tap } from 'rxjs/operators';

import { Observable } from 'rxjs';
import { Location } from './history/history';
import { AfterRender, Router, RouteTransition } from './Router';

export type OnLocationChange = (location: Location) => void;

export class StateHandler<RouteState, RenderResult, RouteHandler> {
  public state: RouteState;
  public transition: RouteTransition<RouteState, RenderResult, RouteHandler>;
  public router: Router<RouteState, RenderResult, RouteHandler>;
  public onHashChange: OnLocationChange;
  public renderState: (
    state: RouteState,
    transition: RouteTransition<RouteState, RenderResult, RouteHandler>
  ) => Observable<RenderResult>;
  public afterRender: AfterRender<RouteState, RenderResult, RouteHandler>;
  public onBeforeUnload: () => string;

  constructor(
    state: RouteState,
    routeTransition: RouteTransition<RouteState, RenderResult, RouteHandler>,
    onHashChange: OnLocationChange,
    renderState: (
      state: RouteState,
      transition: RouteTransition<RouteState, RenderResult, RouteHandler>
    ) => Observable<RenderResult>,
    afterRender: AfterRender<RouteState, RenderResult, RouteHandler>
  ) {
    this.state = state;
    this.transition = routeTransition;
    this.router = routeTransition.router;
    this.onHashChange = onHashChange;
    this.renderState = renderState;
    this.afterRender = afterRender;
    // by default do not prevent transition
    this.onBeforeUnload = () => '';
  }

  public render(): Observable<RenderResult> {
    return this.renderState(this.state, this.transition).pipe(
      tap(renderResult =>
        this.afterRender(this, {
          state: this.state,
          transition: this.transition,
          renderResult,
        })
      )
    );
  }
}
