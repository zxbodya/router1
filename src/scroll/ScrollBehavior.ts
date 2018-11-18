import { Location } from '../history/history';
import { IScrollBehavior, IScrollManager } from './types';

export class ScrollBehavior implements IScrollBehavior {
  private sm: IScrollManager;

  constructor(sm: IScrollManager) {
    this.sm = sm;
  }

  public onLocationChange(location: Location) {
    // side effects after state was rendered
    const locationSource = location.source;
    const locationHash = location.hash;

    // case when scrolling was implicitly disabled in state params
    if (location.state.noscroll) {
      return;
    }
    // should scroll only on this location sources
    if (locationSource === 'push' || locationSource === 'replace') {
      let target;
      if (locationHash !== '') {
        target = document.getElementById(locationHash);
      }

      if (target) {
        this.sm.scrollToElement(target, false);
      } else {
        this.sm.scrollTo(0, 0, false);
      }
    }
  }

  public onHashChange({ hash, source }: Location) {
    this.sm.cancelScroll();
    if (source !== 'push' && source !== 'replace') {
      // hash change is triggered by browser
      // scroll also expected to be restored to previous state
      return;
    }
    this.sm.scrollToAnchor(hash, true);
  }
}
