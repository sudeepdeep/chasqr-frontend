import { Link, useNavigate } from "react-router-dom";
import { LogOut, Zap } from "lucide-react";
import { AuthStore, clearAuth } from "../store/auth";

/**
 * The thin bar across the top of every signed-in screen: brand on the left,
 * sign-out on the right, and nothing else.
 *
 * Navigation lives in the sidebar under this, so the header deliberately stays
 * empty — duplicating links in both places is how these layouts get cluttered.
 */
export default function ShellHeader() {
  const { user } = AuthStore.useState();
  const navigate = useNavigate();

  const logout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5">
      <Link
        to={user ? "/dashboard" : "/"}
        className="flex items-center gap-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
          <Zap size={15} fill="currentColor" strokeWidth={0} />
        </span>
        <span className="font-bebas text-xl tracking-widest text-slate-900">
          CHASQR
        </span>
      </Link>

      <button
        onClick={logout}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
      >
        <LogOut size={14} />
        Logout
      </button>
    </header>
  );
}
