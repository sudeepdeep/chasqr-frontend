/**
 * Class helpers shared by the two sidebars.
 *
 * Deliberately a plain module with no components in it. React Fast Refresh can
 * only hot-swap a file that exports components and nothing else — mixing these
 * helpers in with SideNav meant editing either one stranded the old module and
 * threw "navShellClass is not defined" until a full reload. Keeping values and
 * components in separate files avoids that class of dev-only breakage.
 */

/** Shared row classes, so the workspace nav and the per-site nav can't drift. */
export function navRowClass(
  active: boolean,
  opts: { danger?: boolean; collapsed?: boolean } = {},
) {
  const base = opts.collapsed
    ? "flex items-center justify-center rounded-lg h-9 w-9 mx-auto transition-colors"
    : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors";
  const tone = active
    ? "bg-primary-light text-primary"
    : opts.danger
      ? "text-slate-600 hover:bg-red-50 hover:text-red-600"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
  return `${base} text-[13px] font-medium ${tone}`;
}

/** Outer shell of the sidebar — width, stickiness and scrolling in one place. */
export function navShellClass(collapsed: boolean) {
  return `sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-slate-200 bg-white py-4 transition-[width] duration-200 lg:flex ${
    collapsed ? "w-[60px] px-2" : "w-[228px] px-3"
  }`;
}
