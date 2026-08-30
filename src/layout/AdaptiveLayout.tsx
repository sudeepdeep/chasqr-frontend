import { AuthStore } from "../store/auth";
import AppLayout from "./AppLayout";
import ShellLayout from "./ShellLayout";
import { InShellContext } from "./shellContext";

/**
 * Pages that belong to both the marketing site and the signed-in workspace.
 *
 * Docs and the SEO Checker are public entry points — the checker is the free
 * tool people arrive on before they have an account — so they cannot simply
 * move behind the shell. Signed in, they get the workspace chrome the sidebar
 * already links them from; signed out, they stay on the public site.
 *
 * The choice is safe to make during render because auth hydrates from
 * localStorage synchronously at module load, so there is no signed-out flash
 * on a refresh.
 */
export default function AdaptiveLayout() {
  const { user } = AuthStore.useState();

  return (
    <InShellContext.Provider value={!!user}>
      {user ? <ShellLayout /> : <AppLayout />}
    </InShellContext.Provider>
  );
}
