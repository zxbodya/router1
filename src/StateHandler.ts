import { tap } from 'rxjs/operators';

import { Observable } from 'rxjs';
import { Location } from './history/history';
import { Router, RouteTransition } from './Router';

export type OnLocationChange = (location: Location) => void;

export class StateHandler<State, RenderResult, HandlerPart> {
  public state: State;

  public transition: RouteTransition<State, RenderResult, HandlerPart>;

  public router: Router<State, RenderResult, HandlerPart>;

  public onHashChange: OnLocationChange;

  public onBeforeUnload: () => string;

  constructor(
    state: State,
    routeTransition: RouteTransition<State, RenderResult, HandlerPart>
  ) {
    this.state = state;
    this.transition = routeTransition;
    this.router = routeTransition.router;
    this.onHashChange = this.router.onHashChange;
    // by default do not prevent transition
    this.onBeforeUnload = () => '';
  }

  public render(): Observable<RenderResult> {
    return this.router.renderState(this.state, this.transition).pipe(
      tap(renderResult =>
        this.router.afterRender(this, {
          state: this.state,
          transition: this.transition,
          renderResult,
        })
      )
    );
  }
}
