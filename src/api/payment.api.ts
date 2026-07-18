import api from "./axios";

export const getPaymentInfoAPI = () => api.get("/api/payments/info");

// siteId → a dynamic PRO-upgrade order priced for that site; omit for the flat
// large-upload credit.
export const createPaymentOrderAPI = (
  provider: "razorpay" | "cashfree",
  siteId?: string,
) => api.post("/api/payments/create-order", { provider, ...(siteId ? { siteId } : {}) });

// Payload shape differs per provider — Razorpay verifies a signed triple
// client-side, Cashfree just needs the order id (we re-check status server-side).
export const verifyOrderAPI = (
  data:
    | { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
    | { cashfree_order_id: string },
) => api.post("/api/payments/verify", data);

export const getTransactionsAPI = () => api.get("/api/payments/history");
