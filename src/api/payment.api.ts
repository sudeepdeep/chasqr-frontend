import api from "./axios";

export const getPaymentInfoAPI = () => api.get("/api/payments/info");

export const createPaymentOrderAPI = () => api.post("/api/payments/create-order");

export const verifyOrderAPI = (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => api.post("/api/payments/verify", data);

export const getTransactionsAPI = () => api.get("/api/payments/history");
