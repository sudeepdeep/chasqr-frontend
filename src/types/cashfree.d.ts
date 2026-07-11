interface CashfreeCheckoutOptions {
  paymentSessionId: string;
  redirectTarget?: "_modal" | "_self" | "_blank" | "_top";
}

interface CashfreeInstance {
  checkout(options: CashfreeCheckoutOptions): Promise<{ error?: unknown; paymentDetails?: unknown }>;
}

interface Window {
  Cashfree: new (options: { mode: "sandbox" | "production" }) => CashfreeInstance;
}
