import { useRef, useState } from "react";
import { trackPurchase } from "../lib/analytics";
import {
  RazorpayCheckoutCancelledError,
  createDemoRazorpayOrder,
  loadRazorpayCheckout,
  openRazorpayCheckout,
  verifyDemoRazorpayPayment,
} from "../lib/razorpay";

const DEMO_ITEM_ID = "study-flow-demo";
const DEMO_ITEM_NAME = "Study Flow Demo Access";
const DEMO_PRICE = 10;
const DEMO_CURRENCY = "INR";

type Stage = "idle" | "creating-order" | "opening-checkout" | "verifying";

const STAGE_LABEL: Record<Stage, string> = {
  idle: `Pay \u20B9${DEMO_PRICE} (Test Mode)`,
  "creating-order": "Creating order...",
  "opening-checkout": "Opening checkout...",
  verifying: "Verifying payment...",
};

type PurchaseStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "cancelled"; message: string }
  | { kind: "error"; message: string };

export default function DemoPayment() {
  const [stage, setStage] = useState<Stage>("idle");
  const [status, setStatus] = useState<PurchaseStatus>({ kind: "idle" });
  const busyRef = useRef(false);

  async function handlePay() {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus({ kind: "idle" });

    try {
      setStage("creating-order");
      const order = await createDemoRazorpayOrder();

      setStage("opening-checkout");
      const Razorpay = await loadRazorpayCheckout();
      const payment = await openRazorpayCheckout(Razorpay, order);

      setStage("verifying");
      const result = await verifyDemoRazorpayPayment(payment);
      if (!result.verified) {
        throw new Error("Payment was not verified by the server");
      }

      trackPurchase({
        transaction_id: payment.razorpay_payment_id,
        value: DEMO_PRICE,
        currency: DEMO_CURRENCY,
        items: [
          {
            item_id: DEMO_ITEM_ID,
            item_name: DEMO_ITEM_NAME,
            price: DEMO_PRICE,
            quantity: 1,
          },
        ],
        demo: true,
      });

      setStage("idle");
      setStatus({
        kind: "success",
        message:
          "Payment verified in TEST mode. No real money was charged.",
      });
    } catch (err) {
      setStage("idle");
      if (err instanceof RazorpayCheckoutCancelledError) {
        setStatus({
          kind: "cancelled",
          message: "Checkout was cancelled. No payment was made.",
        });
      } else {
        setStatus({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Demo payment failed",
        });
      }
    } finally {
      busyRef.current = false;
    }
  }

  const busy = stage !== "idle";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demo Payment</h1>
          <p className="text-gray-500 mt-1">
            Try the checkout flow without spending real money.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1">
          Test Mode
        </span>
      </div>

      {status.kind === "success" && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {status.message}
        </div>
      )}
      {status.kind === "cancelled" && (
        <div className="p-3 rounded-lg bg-slate-100 text-sm text-slate-600 border border-slate-200">
          {status.message}
        </div>
      )}
      {status.kind === "error" && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700 border border-red-200">
          {status.message}
        </div>
      )}

      <div className="max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
          <h2 className="font-semibold text-gray-900">{DEMO_ITEM_NAME}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {DEMO_ITEM_NAME} activation for the {DEMO_ITEM_ID} plan.
          </p>
          <p className="mt-4 text-3xl font-bold text-gray-900 tabular-nums">
            {"\u20B9"}
            {DEMO_PRICE.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            One-time demo plan &middot; INR
          </p>
          <button
            onClick={() => void handlePay()}
            disabled={busy}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {STAGE_LABEL[stage]}
          </button>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            TEST MODE: Razorpay&apos;s hosted test checkout opens. Use
            Razorpay&apos;s test cards (e.g. 4111 1111 1111 1111) with any
            future expiry and CVV to complete the checkout. No real cards,
            UPI, or bank details are collected or stored by Study Flow.
          </div>
        </div>
      </div>
    </div>
  );
}