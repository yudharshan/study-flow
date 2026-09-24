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
  }
}

export function initAnalytics(): void {
  if (typeof window.gtag !== "function" || !GA_MEASUREMENT_ID) return;
  window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false });
}

export function trackEvent(
  name: AnalyticsEventName,
  params: Record<string, unknown> = {}
): void {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackPageView(path: string): void {
  trackEvent("page_view", { page_path: path });
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