import { IScrollManager } from './types';

type EasingFunction = (
  time: number,
  beginning: number,
  change: number,
  duration: number
) => number;

const easeInOutQuad: EasingFunction = (t, b, c, d) => {
  // t: current time, b: beginning value, c: change in value, d: duration
  // Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
  t /= d / 2;
  if (t < 1) {
    return (c / 2) * t * t + b;
  }
  t--;
  return (-c / 2) * (t * (t - 2) - 1) + b;
};

const noop = () => undefined;

export class ScrollManager implements IScrollManager {
  private readonly easing: EasingFunction;
  private readonly duration: number;
  private canceled: boolean = false;
  private rafId?: number;
  private done: () => void = noop;
  constructor(options: { easing?: EasingFunction; duration?: number } = {}) {
    this.easing = options.easing || easeInOutQuad;
    this.duration = options.duration || 400;
  }

  public animateScroll(left: number, top: number, done: () => void) {
    this.cancelScroll();

    const startTime = Date.now();
    const startTop = window.pageYOffset;
    const startLeft = window.pageXOffset;

    this.canceled = false;
    this.done = done;

    const animate = () => {
      if (this.canceled) {
        return;
      }
      const elapsed = Date.now() - startTime;
      if (this.duration <= elapsed) {
        window.scrollTo(left, top);
        done();
      } else {
        window.scrollTo(
          this.easing(elapsed, startLeft, left - startLeft, this.duration),
          this.easing(elapsed, startTop, top - startTop, this.duration)
        );
        this.rafId = window.requestAnimationFrame(animate);
      }
    };

    animate();
  }

  public cancelScroll() {
    this.canceled = true;
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.done();
      this.rafId = undefined;
      this.done = noop;
    }
  }

  public scrollTo(left: number, top: number, animate?: boolean) {
    this.cancelScroll();
    if (animate) {
      const onWheelListener = () => {
        this.cancelScroll();
      };
      window.addEventListener('wheel', onWheelListener);
      this.animateScroll(left, top, () => {
        window.removeEventListener('wheel', onWheelListener);
      });
    } else {
      window.scrollTo(left, top);
    }
  }

  public scrollToElement(target: Element, animate?: boolean) {
    this.cancelScroll();
    if (!target.ownerDocument || !target.ownerDocument.documentElement) {
      return;
    }
    const documentElement = target.ownerDocument.documentElement;
    const boundingClientRect = target.getBoundingClientRect();
    this.scrollTo(
      window.pageXOffset + boundingClientRect.left - documentElement.clientLeft,
      window.pageYOffset + boundingClientRect.top - documentElement.clientTop,
      animate
    );
  }

  public scrollToAnchor(anchor: string, animate?: boolean) {
    const target = document.getElementById(anchor);
    if (target) {
      this.scrollToElement(target, animate);
      return true;
    }
    this.cancelScroll();
    return false;
  }
}
