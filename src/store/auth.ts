import { Store } from 'pullstate';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'paid';
  status: string;
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
  localStorage.setItem('chasqr_token', token);
  localStorage.setItem('chasqr_user', JSON.stringify(user));
  AuthStore.update((s) => { s.user = user; s.token = token; });
};

export const clearAuth = () => {
  localStorage.removeItem('chasqr_token');
  localStorage.removeItem('chasqr_user');
  AuthStore.update((s) => { s.user = null; s.token = null; });
};
