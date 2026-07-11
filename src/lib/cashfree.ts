let scriptPromise: Promise<void> | null = null;

/** Loads the Cashfree Checkout script once and caches the promise. */
export function loadCashfreeScript(): Promise<void> {
  if (window.Cashfree) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Cashfree checkout script"));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}
