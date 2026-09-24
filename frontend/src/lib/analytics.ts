import { apiRequest } from "./api";

export const GA_MEASUREMENT_ID: string | undefined =
  import.meta.env.VITE_GA_MEASUREMENT_ID;

export type AnalyticsEventName =
  | "page_view"
  | "sign_up"
  | "login"
  | "subject_created"
  | "task_created"
  | "task_completed"
  | "study_session_started"
  | "study_session_completed"
  | "reminder_created"
  | "purchase";

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Ensure dataLayer and window.gtag exist globally immediately upon module evaluation
if (typeof window !== "undefined") {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      // Must push the arguments object directly, NOT an array
      window.dataLayer?.push(arguments);
    };
  }
}

let analyticsInitialized = false;

export function initAnalytics(): void {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  if (!GA_MEASUREMENT_ID) {
    console.warn("GA Warning: VITE_GA_MEASUREMENT_ID environment variable is missing.");
    return;
  }

  // 1. Queue initial js command
  window.gtag?.("js", new Date());

  // 2. Dynamically inject the Google tag script if not already present
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }

  // 3. Configure GA4 with debug_mode enabled for instant DebugView tracking
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    debug_mode: true
  });
}

export function trackEvent(
  name: AnalyticsEventName | string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackPageView(path: string): void {
  trackEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title
  });
}

export interface PurchaseItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

export type PurchaseEventParams = Record<string, unknown> & {
  transaction_id: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
  demo: boolean;
};

export function trackPurchase(params: PurchaseEventParams): void {
  trackEvent("purchase", params);
}

export interface DemoPurchaseInput {
  productId: string;
  productName: string;
  amountInRs: number;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  metadata: {
    productId: string;
    productName: string;
    amountInRs: number;
    currency: string;
    demo: boolean;
  } | null;
  timestamp: string;
}

export function recordDemoPurchase(
  input: DemoPurchaseInput
): Promise<AnalyticsEvent> {
  return apiRequest<AnalyticsEvent>("/demo-purchase", {
    method: "POST",
    body: JSON.stringify(input),
  });
}