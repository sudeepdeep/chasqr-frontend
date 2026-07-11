import api from "./axios";

export const checkPublicUrlAPI = (url: string) =>
  api.post("/api/seo/check", { url });

export const checkOwnSiteSEOAPI = (siteId: string, filename: string) =>
  api.get(`/api/sites/${siteId}/seo-check`, { params: { page: filename } });
