import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarStore, toggleSidebar } from "../store/sidebar";
import { navRowClass, navShellClass } from "./navStyles";

export interface SideNavItem {
  to: string;
  label: string;
  icon: any;
  /** Small count shown on the right — e.g. unread submissions. */
  badge?: number;
  /** Styles the row for a destructive destination. */
  danger?: boolean;
  /** Marks active on exactly this path only, not on sub-paths. */
  end?: boolean;
}

export interface SideNavGroup {
  /** Small uppercase heading. Omit for an ungrouped run of links. */
  label?: string;
  items: SideNavItem[];
}

/** The collapse control, shared by both shells so it always sits in the same spot. */
export function CollapseToggle({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      onClick={toggleSidebar}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={`mt-3 flex items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${
        collapsed ? "mx-auto h-9 w-9 justify-center" : "px-2.5"
      }`}
    >
      {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      {!collapsed && <span>Collapse</span>}
    </button>
  );
}

/**
 * The sidebar shared by every signed-in screen.
 *
 * Collapsing keeps the icons rather than hiding the bar outright: a strip of
 * icons is still navigable, where a hidden bar means opening something just to
 * find out where you are. Labels are dropped and the title attribute carries
 * them instead.
 */
export default function SideNav({
  groups,
  header,
  footer,
}: {
  groups: SideNavGroup[];
  /** Rendered above the links — the back link and site chip in a project. */
  header?: React.ReactNode;
  /** Pinned to the bottom — docs link, user chip, danger actions. */
  footer?: React.ReactNode;
}) {
  const { collapsed } = SidebarStore.useState();

  const row = (item: SideNavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to + item.label}
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          navRowClass(isActive, { danger: item.danger, collapsed })
        }
      >
        <span className="relative shrink-0">
          <Icon size={16} />
          {/* Collapsed, the count has nowhere to sit inline — so it becomes a
              dot on the icon rather than disappearing entirely. */}
          {collapsed && !!item.badge && item.badge > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {!!item.badge && item.badge > 0 && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <nav className={navShellClass(collapsed)}>
      {header}

      <div className="flex flex-1 flex-col gap-5">
        {groups.map((group, i) => (
          <div key={group.label ?? i} className="flex flex-col gap-0.5">
            {group.label &&
              (collapsed ? (
                // A rule keeps the grouping readable once the words are gone.
                i > 0 && <span className="mx-auto mb-1 h-px w-6 bg-slate-200" />
              ) : (
                <span className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {group.label}
                </span>
              ))}
            {group.items.map(row)}
          </div>
        ))}
      </div>

      {footer && <div className="mt-4 flex flex-col gap-0.5">{footer}</div>}
      <CollapseToggle collapsed={collapsed} />
    </nav>
  );
}
