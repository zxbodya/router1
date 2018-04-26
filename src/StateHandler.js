import { tap } from 'rxjs/operators';

export class StateHandler {
  constructor(state, transition) {
    this.state = state;
    this.transition = transition;
    this.router = transition.router;
    this.onHashChange = this.router.onHashChange;
    // by default do not prevent transition
    this.onBeforeUnload = () => '';
  }

  render() {
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
