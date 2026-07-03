import api from "./axios";

export const getPaymentInfoAPI = () => api.get("/api/payments/info");

export const verifyOrderAPI = (orderId: string) =>
  api.post("/api/payments/verify", { orderId });

export const getTransactionsAPI = () => api.get("/api/payments/history");
