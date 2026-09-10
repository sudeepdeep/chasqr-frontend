import api from './axios';

export const getStatsAPI = () => api.get('/api/admin/stats');
export const getAllUsersAPI = () => api.get('/api/admin/users');
export const getAllSitesAdminAPI = () => api.get('/api/admin/sites');
export const updateUserStatusAPI = (userId: string, status: string) =>
  api.put(`/api/admin/users/${userId}/status`, { status });
export const updateUserRoleAPI = (userId: string, role: string) =>
  api.put(`/api/admin/users/${userId}/role`, { role });
export const adminDeleteSiteAPI = (siteId: string) =>
  api.delete(`/api/admin/sites/${siteId}`);
export const adminSetSitePlanAPI = (siteId: string, plan: 'free' | 'paid') =>
  api.put(`/api/admin/sites/${siteId}/plan`, { plan });
export const sendAdminEmailAPI = (data: {
  subject: string;
  html: string;
  audience: 'all' | 'free' | 'paid' | 'test' | 'individual';
  /** 'branded' wraps the content in the Chasqr shell; 'raw' sends it as-is. */
  template?: 'branded' | 'raw';
  /** Required when audience === 'individual'. */
  recipients?: string[];
}) => api.post('/api/admin/email', data);
export const getAdminSupportRequestsAPI = () => api.get('/api/admin/support-requests');
export const getAdminRequestMessagesAPI = (id: string) =>
  api.get(`/api/admin/support-requests/${id}/messages`);
export const getAdminExpertsAPI = () => api.get('/api/admin/experts');

export interface ExpertPayload {
  name: string;
  email: string;
  /** Required on create; omit or leave blank on update to keep the current one. */
  password?: string;
  expertTitle?: string;
  expertSkills?: string[];
  expertBio?: string;
  expertStatus?: 'available' | 'occupied' | 'offline';
  status?: 'active' | 'suspended';
}

export const createExpertAPI = (data: ExpertPayload) =>
  api.post('/api/admin/experts', data);
export const updateExpertAPI = (userId: string, data: ExpertPayload) =>
  api.put(`/api/admin/experts/${userId}`, data);
/** Revokes expert access. The account itself is kept and demoted to 'user'. */
export const removeExpertAPI = (userId: string) =>
  api.delete(`/api/admin/experts/${userId}`);
export const getAdminPaymentsAPI = () => api.get('/api/admin/payments');
