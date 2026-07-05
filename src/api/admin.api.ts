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
export const getAdminSupportRequestsAPI = () => api.get('/api/admin/support-requests');
export const getAdminRequestMessagesAPI = (id: string) =>
  api.get(`/api/admin/support-requests/${id}/messages`);
export const getAdminExpertsAPI = () => api.get('/api/admin/experts');
export const getAdminPaymentsAPI = () => api.get('/api/admin/payments');
