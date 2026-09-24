import { apiRequest } from "./api";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpayOrder {
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  demo: boolean;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  [key: string]: unknown;
}

export interface RazorpayHandleError {
  code: number;
  description: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: { [key: string]: unknown };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
  error?: (error: RazorpayHandleError) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export class RazorpayCheckoutCancelledError extends Error {}

let checkoutLoadPromise: Promise<RazorpayConstructor> | null = null;

export function loadRazorpayCheckout(): Promise<RazorpayConstructor> {
  if (!checkoutLoadPromise) {
    checkoutLoadPromise = new Promise<RazorpayConstructor>((resolve, reject) => {
      const fail = (message: string) => {
        checkoutLoadPromise = null;
        reject(new Error(message));
      };
      const script = document.createElement("script");
      script.src = RAZORPAY_CHECKOUT_SRC;
      script.async = true;
      script.onload = () => {
        if (typeof window.Razorpay === "function") {
          resolve(window.Razorpay);
        } else {
          fail("Razorpay checkout failed to initialize");
        }
      };
      script.onerror = () => {
        fail("Could not load Razorpay checkout");
      };
      document.head.appendChild(script);
    });
  }
  return checkoutLoadPromise;
}

export function createDemoRazorpayOrder(): Promise<RazorpayOrder> {
  return apiRequest<RazorpayOrder>("/razorpay/create-order", {
    method: "POST",
  });
}

export interface RazorpayVerifyResult {
  verified: boolean;
  event: {
    id: string;
    eventName: string;
    metadata: Record<string, unknown> | null;
    timestamp: string;
  };
}

export function verifyDemoRazorpayPayment(
  payment: RazorpayPaymentResponse
): Promise<RazorpayVerifyResult> {
  return apiRequest<RazorpayVerifyResult>("/razorpay/verify", {
    method: "POST",
    body: JSON.stringify({
      razorpay_order_id: payment.razorpay_order_id,
      razorpay_payment_id: payment.razorpay_payment_id,
      razorpay_signature: payment.razorpay_signature,
    }),
  });
}

export function openRazorpayCheckout(
  Razorpay: RazorpayConstructor,
  order: RazorpayOrder
): Promise<RazorpayPaymentResponse> {
  return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };
    const instance = new Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: "Study Flow Demo",
      description: "Study Flow Demo Access - Test Mode (no real payment)",
      order_id: order.orderId,
      theme: {
        color: "#4338ca",
      },
      modal: {
        ondismiss: () =>
          finish(() =>
            reject(new RazorpayCheckoutCancelledError("Checkout cancelled"))
          ),
      },
      handler: (response) => finish(() => resolve(response)),
      error: (err) =>
        finish(() =>
          reject(
            new Error(err.description || "Razorpay checkout failed")
          )
        ),
    });
    instance.on("payment.failed", () =>
      finish(() => reject(new Error("Payment failed")))
    );
    instance.open();
  });
}