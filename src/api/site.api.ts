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

export const getPageHTMLAPI = (siteId: string, page: string) =>
  api.get(`/api/sites/${siteId}/raw`, { params: { page } });

export const getColorsAPI = (siteId: string, page: string) =>
  api.get(`/api/sites/${siteId}/colors`, { params: { page } });

export const updateColorsAPI = (siteId: string, page: string, replacements: Record<string, string>) =>
  api.put(`/api/sites/${siteId}/colors`, { page, replacements });

export const upgradeSiteAPI = (siteId: string) =>
  api.put(`/api/sites/${siteId}/upgrade`);

export const getUpgradeQuoteAPI = (siteId: string) =>
  api.get(`/api/sites/${siteId}/upgrade-quote`);

export const uploadSourceArchiveAPI = (siteId: string, formData: FormData) =>
  api.post(`/api/sites/${siteId}/source`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const removeSourceArchiveAPI = (siteId: string) =>
  api.delete(`/api/sites/${siteId}/source`);

export const updateElementsAPI = (
  siteId: string,
  page: string,
  actions: { key: string; action: 'hide' | 'show' | 'duplicate' | 'delete' }[]
) => api.put(`/api/sites/${siteId}/elements`, { page, actions });

export const addElementAPI = (
  siteId: string,
  page: string,
  afterKey: string,
  type: 'text' | 'image' | 'link',
  value: string,
  href?: string,
) => api.post(`/api/sites/${siteId}/elements/add`, { page, afterKey, type, value, href });

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

export const getAnalyticsAPI = (siteId: string) =>
  api.get(`/api/sites/${siteId}/analytics`);

export const updateSEOAPI = (
  siteId: string,
  data: { page: string; title?: string; metaDescription?: string; ogImage?: string; ogTitle?: string; ogDescription?: string }
) => api.put(`/api/sites/${siteId}/seo`, data);

export const uploadAssetAPI = (siteId: string, formData: FormData) =>
  api.post(`/api/sites/${siteId}/assets`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const setFaviconAPI = (siteId: string, url: string) =>
  api.put(`/api/sites/${siteId}/favicon`, { url });

export const setCustomDomainAPI = (siteId: string, domain: string) =>
  api.put(`/api/sites/${siteId}/custom-domain`, { domain });

export const removeCustomDomainAPI = (siteId: string) =>
  api.delete(`/api/sites/${siteId}/custom-domain`);
