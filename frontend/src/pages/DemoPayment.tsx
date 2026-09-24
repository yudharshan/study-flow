import { useState } from "react";
import { recordDemoPurchase, trackPurchase } from "../lib/analytics";

interface DemoProduct {
  id: string;
  name: string;
  blurb: string;
  amountInRs: number;
}

const PRODUCTS: DemoProduct[] = [
  {
    id: "mse-starter",
    name: "MSE Starter",
    blurb: "Entry-level demo plan for the MSE scenario.",
    amountInRs: 99,
  },
  {
    id: "mse-pro",
    name: "MSE Pro",
    blurb: "The most popular demo plan.",
    amountInRs: 199,
  },
  {
    id: "mse-elite",
    name: "MSE Elite",
    blurb: "The full-feature demo plan.",
    amountInRs: 299,
  },
];

type PurchaseStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export default function DemoPayment() {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<PurchaseStatus>({ kind: "idle" });

  async function handlePurchase(product: DemoProduct) {
    setBusyId(product.id);
    setStatus({ kind: "idle" });
    try {
      const event = await recordDemoPurchase({
        productId: product.id,
        productName: product.name,
        amountInRs: product.amountInRs,
      });
      trackPurchase({
        transaction_id: event.id,
        value: product.amountInRs,
        currency: "INR",
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            price: product.amountInRs,
            quantity: 1,
          },
        ],
        demo: true,
      });
      setStatus({
        kind: "success",
        message: `Demo purchase recorded for ${product.name}. No real payment was made.`,
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Demo purchase failed",
      });
    } finally {
      setBusyId(null);
    }
  }

  const busy = busyId !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demo Payment</h1>
        <p className="text-gray-500 mt-1">
          Simulated checkout for the MSE demo. No cards, UPI, bank details, or
          real money are used anywhere.
        </p>
      </div>

      {status.kind === "success" && (
        <div className="p-3 rounded-lg bg-emerald-50 text-sm text-emerald-700 border border-emerald-200">
          {status.message}
        </div>
      )}
      {status.kind === "error" && (
        <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700 border border-red-200">
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col"
          >
            <h2 className="font-semibold text-gray-900">{product.name}</h2>
            <p className="text-xs text-gray-500 mt-1">{product.blurb}</p>
            <p className="mt-4 text-3xl font-bold text-gray-900 tabular-nums">
              {"\u20B9"}
              {product.amountInRs.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              One-time demo plan &middot; INR
            </p>
            <button
              onClick={() => void handlePurchase(product)}
              disabled={busy}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 text-white text-sm font-medium px-4 py-2 hover:bg-primary-700 transition-colors disabled:opacity-60"
            >
              {busyId === product.id
                ? "Simulating..."
                : `Simulate ${product.name} Purchase`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}