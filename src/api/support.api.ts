import api from "./axios";

export const getExpertsAPI = () => api.get("/api/support/experts");

export const getMyExpertProfileAPI = () => api.get("/api/support/experts/me");

export const updateExpertStatusAPI = (status: "available" | "offline") =>
  api.put("/api/support/experts/status", { status });

export const createSupportRequestAPI = (data: {
  expertId: string;
  siteId: string;
  topic: string;
}) => api.post("/api/support/requests", data);

export const getMyRequestsAPI = () => api.get("/api/support/requests");

export const getSupportRequestAPI = (id: string) =>
  api.get(`/api/support/requests/${id}`);

export const acceptRequestAPI = (id: string) =>
  api.put(`/api/support/requests/${id}/accept`);

export const completeRequestAPI = (id: string) =>
  api.put(`/api/support/requests/${id}/complete`);

export const cancelRequestAPI = (id: string) =>
  api.put(`/api/support/requests/${id}/cancel`);

export const getMessagesAPI = (id: string) =>
  api.get(`/api/support/requests/${id}/messages`);

export const sendMessageAPI = (id: string, text: string) =>
  api.post(`/api/support/requests/${id}/messages`, { text });

export const sendImageMessageAPI = (id: string, file: File, caption?: string) => {
  const fd = new FormData();
  fd.append("file", file);
  if (caption) fd.append("text", caption);
  return api.post(`/api/support/requests/${id}/messages/image`, fd);
};

export const shareCodeAPI = (id: string) =>
  api.post(`/api/support/requests/${id}/share-code`);

export const createPaymentLinkAPI = (id: string, amount: number) =>
  api.post(`/api/support/requests/${id}/payment-link`, { amount });
