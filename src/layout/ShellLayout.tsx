import { Link, Outlet } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Headset,
  LayoutGrid,
  Receipt,
  Search,
  Shield,
} from "lucide-react";
import { AuthStore } from "../store/auth";
import { SupportUnreadStore, totalUnread } from "../store/supportUnread";
import ShellHeader from "./ShellHeader";
import SideNav, { SideNavGroup } from "./SideNav";
import { navRowClass } from "./navStyles";
import { SidebarStore } from "../store/sidebar";

/**
 * App shell for the signed-in workspace: header, workspace sidebar, page.
 *
 * Site Admin is deliberately not under this route — inside a project the
 * sidebar swaps to that site's sections, so it builds its own shell from the
 * same header and SideNav pieces.
 */
export default function ShellLayout() {
  const { user } = AuthStore.useState();
  const unread = totalUnread(SupportUnreadStore.useState());
  const { collapsed } = SidebarStore.useState();

  const groups: SideNavGroup[] = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { to: "/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Growth",
      items: [
        { to: "/seo-checker", label: "SEO Checker", icon: Search },
        { to: "/transactions", label: "Transactions", icon: Receipt },
      ],
    },
  ];

  // Role-gated rows, appended only when they apply — an empty "Account" heading
  // above nothing is worse than no heading.
  const accountItems = [];
  if (user?.role === "expert" || user?.role === "admin") {
    accountItems.push({
      to: "/expert",
      label: "Expert Panel",
      icon: Headset,
      badge: unread,
    });
  }
  if (user?.role === "admin") {
    accountItems.push({ to: "/admin", label: "Admin", icon: Shield });
  }
  if (accountItems.length) groups.push({ label: "Account", items: accountItems });

  return (
    <div className="min-h-screen bg-white">
      <ShellHeader />
      <div className="flex">
        <SideNav
          groups={groups}
          footer={
            <>
              <Link
                to="/docs"
                title={collapsed ? "Docs" : undefined}
                className={navRowClass(false, { collapsed })}
              >
                <BookOpen size={16} className="shrink-0" />
                {!collapsed && "Docs"}
              </Link>

              {/* Doubles as the link to account settings — the design shows a
                  plain chip, but a name and plan sitting there invites a click.
                  Collapsed it becomes just the avatar, which still reads as
                  "you" and still goes to the same place. */}
              <Link
                to="/profile"
                title={collapsed ? user?.name || "Account" : undefined}
                className={
                  collapsed
                    ? "mx-auto mt-1 flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
                    : "mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 px-2.5 py-2 transition-colors hover:border-slate-300 hover:bg-slate-50"
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light font-bebas text-sm text-primary">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[12.5px] font-medium text-slate-800">
                      {user?.name || "Account"}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {user?.plan === "paid" ? "Pro plan" : "Free plan"}
                    </span>
                  </span>
                )}
              </Link>
            </>
          }
        />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
