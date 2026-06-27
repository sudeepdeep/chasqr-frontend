import api from './axios';

export const uploadZipAPI = (formData: FormData) =>
  api.post('/api/sites/upload-zip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const uploadFilesAPI = (formData: FormData) =>
  api.post('/api/sites/upload-files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMySitesAPI = () => api.get('/api/sites');

export const getSiteAPI = (siteId: string) => api.get(`/api/sites/${siteId}`);

export const updateContentAPI = (
  siteId: string,
  page: string,
  updates: Record<string, string>
) => api.put(`/api/sites/${siteId}/content`, { page, updates });

export const renameSiteAPI = (siteId: string, name: string) =>
  api.put(`/api/sites/${siteId}/name`, { name });

export const redeployZipAPI = (siteId: string, formData: FormData) =>
  api.put(`/api/sites/${siteId}/redeploy-zip`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const redeployFilesAPI = (siteId: string, formData: FormData) =>
  api.put(`/api/sites/${siteId}/redeploy-files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateSlugAPI = (siteId: string, slug: string) =>
  api.put(`/api/sites/${siteId}/slug`, { slug });

export const checkSlugAPI = (slug: string) =>
  api.get(`/api/sites/check-slug?slug=${encodeURIComponent(slug)}`);

export const toggleStatusAPI = (siteId: string) =>
  api.put(`/api/sites/${siteId}/status`);

export const deleteSiteAPI = (siteId: string) =>
  api.delete(`/api/sites/${siteId}`);
