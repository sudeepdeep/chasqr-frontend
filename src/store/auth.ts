import { Store } from 'pullstate';
import { queryClient } from '../queries/client';
import { resetSupportUnread } from './supportUnread';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'expert';
  plan: 'free' | 'paid';
  status: string;
  email_verified: boolean;
  mfaEnabled: boolean;
  githubUsername?: string;
  githubAvatarUrl?: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

const stored = localStorage.getItem('chasqr_user');

export const AuthStore = new Store<AuthState>({
  user: stored ? JSON.parse(stored) : null,
  token: localStorage.getItem('chasqr_token'),
  isLoading: false,
});

export const setAuth = (user: User, token: string) => {
  // Whatever is cached belongs to whoever was signed in a moment ago. Signing
  // in as somebody else must not inherit their site list — and because the
  // cache is keyed by resource rather than by account, the only safe answer
  // is to empty it on any change of identity.
  queryClient.clear();
  localStorage.setItem('chasqr_token', token);
  localStorage.setItem('chasqr_user', JSON.stringify(user));
  AuthStore.update((s) => { s.user = user; s.token = token; });
};

export const clearAuth = () => {
  localStorage.removeItem('chasqr_token');
  localStorage.removeItem('chasqr_user');
  AuthStore.update((s) => { s.user = null; s.token = null; });
  queryClient.clear();
  resetSupportUnread();
};
