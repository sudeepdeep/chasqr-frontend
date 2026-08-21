import { Navigate } from 'react-router-dom';
import { AuthStore } from '../store/auth';

interface Props {
  children: React.ReactNode;
}

/**
 * Mirror of ProtectedRoute: keeps a signed-in user off the marketing page.
 *
 * Guarding the route rather than rewriting every link means it holds for every
 * way of arriving at `/` — the navbar logo, a bookmark, the back button, a
 * shared link — instead of only the paths we remembered to change.
 *
 * `replace` matters here: without it the redirect leaves `/` in history, so
 * pressing Back from the dashboard bounces through this guard and lands the
 * user right back where they started.
 *
 * Auth is read from localStorage when the store is created, so `user` is known
 * on the first render and there is no flash of the landing page before the
 * redirect happens.
 */
export default function PublicOnlyRoute({ children }: Props) {
  const { user } = AuthStore.useState();

  if (user) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
