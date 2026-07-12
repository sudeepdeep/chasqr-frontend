import api from "./axios";

export const getPaymentInfoAPI = () => api.get("/api/payments/info");

export const createPaymentOrderAPI = (provider: "razorpay" | "cashfree") =>
  api.post("/api/payments/create-order", { provider });

// Payload shape differs per provider — Razorpay verifies a signed triple
// client-side, Cashfree just needs the order id (we re-check status server-side).
export const verifyOrderAPI = (
  data:
    | { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
    | { cashfree_order_id: string },
) => api.post("/api/payments/verify", data);

export const getTransactionsAPI = () => api.get("/api/payments/history");
