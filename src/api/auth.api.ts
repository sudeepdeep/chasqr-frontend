import api from './axios';

export const registerAPI = (data: { name: string; email: string; password: string }) =>
  api.post('/api/auth/register', data);

export const loginAPI = (data: { email: string; password: string }) =>
  api.post('/api/auth/login', data);

export const googleAuthAPI = (credential: string) =>
  api.post('/api/auth/google', { credential });

export const getMeAPI = () => api.get('/api/auth/me');
