import { Location } from '../history/history';

export interface IScrollManager {
  cancelScroll(): void;

  scrollTo(left: number, top: number, animate?: boolean): void;

  scrollToElement(target: Element, animate?: boolean): void;

  scrollToAnchor(anchor: string, animate?: boolean): void;
}

export interface IScrollBehavior {
  onLocationChange(location: Location): void;
  onHashChange(location: Location): void;
}
