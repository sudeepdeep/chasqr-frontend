import api from './axios';

export const registerAPI = (data: { name: string; email: string; password: string; acceptedTerms: boolean }) =>
  api.post('/api/auth/register', data);

export const verifyOtpAPI = (email: string, otp: string) =>
  api.post('/api/auth/verify-otp', { email, otp });

export const resendOtpAPI = (email: string) =>
  api.post('/api/auth/resend-otp', { email });

export const loginAPI = (data: { email: string; password: string }) =>
  api.post('/api/auth/login', data);

export const verifyLoginMfaAPI = (email: string, otp: string) =>
  api.post('/api/auth/login/verify-mfa', { email, otp });

export const resendLoginMfaAPI = (email: string) =>
  api.post('/api/auth/login/resend-mfa', { email });

export const requestEnableMfaAPI = () => api.post('/api/auth/mfa/enable/request');

export const confirmEnableMfaAPI = (otp: string) =>
  api.post('/api/auth/mfa/enable/confirm', { otp });

export const disableMfaAPI = (password: string) =>
  api.put('/api/auth/mfa/disable', { password });

export const googleAuthAPI = (credential: string) =>
  api.post('/api/auth/google', { credential });

export const getMeAPI = () => api.get('/api/auth/me');

export const updateProfileAPI = (name: string) => api.put('/api/auth/me', { name });

export const changePasswordAPI = (current_password: string, new_password: string) =>
  api.put('/api/auth/change-password', { current_password, new_password });

export const forgotPasswordAPI = (email: string) =>
  api.post('/api/auth/forgot-password', { email });

export const resetPasswordAPI = (token: string, email: string, new_password: string) =>
  api.post('/api/auth/reset-password', { token, email, new_password });
