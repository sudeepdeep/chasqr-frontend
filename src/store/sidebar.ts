import { Store } from 'pullstate';

const KEY = 'chasqr_sidebar_collapsed';

interface SidebarState {
  collapsed: boolean;
}

/**
 * Whether the left navigation is collapsed to icons.
 *
 * Kept in a store rather than local state because two different shells render
 * a sidebar — the workspace one and the per-site one — and collapsing in a
 * project then finding it expanded again on the dashboard would feel broken.
 * Persisted so the choice survives a reload: someone who collapses it is
 * usually doing so to work in the builder, which means many page loads.
 */
export const SidebarStore = new Store<SidebarState>({
  collapsed: localStorage.getItem(KEY) === '1',
});

export const toggleSidebar = () =>
  SidebarStore.update((s) => {
    s.collapsed = !s.collapsed;
    localStorage.setItem(KEY, s.collapsed ? '1' : '0');
  });
