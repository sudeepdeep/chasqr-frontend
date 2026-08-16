import { Store } from 'pullstate';

/**
 * Whether the navbar currently has a dark full-bleed banner behind it.
 *
 * LandingBanner owns this: it watches its own bottom edge and flips the flag
 * as the banner passes under the bar. The navbar only reads it, so any page
 * that drops in a <LandingBanner /> gets the see-through bar automatically —
 * no route list to keep in sync.
 */
interface NavOverlayState {
  active: boolean;
}

export const NavOverlayStore = new Store<NavOverlayState>({ active: false });

export const setNavOverlay = (active: boolean) =>
  NavOverlayStore.update((s) => {
    s.active = active;
  });
