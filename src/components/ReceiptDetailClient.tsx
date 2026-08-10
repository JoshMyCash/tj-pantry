"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/Toast";

type Location = { id: string; name: string };
type Product = { id: string; name: string; status: string };
type Item = {
  id: string;
  rawName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productId: string | null;
  product: Product | null;
};

type Receipt = {
  id: string;
  purchasedAt: string;
  source: string;
  tax: number;
  subtotal: number;
  total: number;
  notes: string;
  rawText: string;
  locationId: string | null;
  location: Location | null;
  items: Item[];
};

function toDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function ReceiptDetailClient({
  receipt: initial,
  locations,
  products,
}: {
  receipt: Receipt;
  locations: Location[];
  products: Product[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [receipt, setReceipt] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkQuery, setLinkQuery] = useState("");

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "ACTIVE"),
    [products],
  );

  const linkMatches = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    if (!q) return activeProducts.slice(0, 40);
    return activeProducts
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [activeProducts, linkQuery]);

  async function saveMeta(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Could not save receipt");
      const next = await res.json();
      setReceipt({
        ...next,
        purchasedAt: new Date(next.purchasedAt).toISOString(),
      });
      toast.success("Receipt updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save receipt");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReceipt() {
    if (!window.confirm("Delete this receipt? This can’t be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete receipt");
      toast.success("Receipt deleted");
      router.push("/receipts");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
      setBusy(false);
    }
  }

  async function linkItem(itemId: string, productId: string | null) {
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Could not link product");
      const nextItem = await res.json();
      setReceipt((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? nextItem : i)),
      }));
      setLinkingId(null);
      setLinkQuery("");
      toast.success(productId ? "Linked product" : "Unlinked product");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Link failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(itemId: string) {
    if (!window.confirm("Remove this line from the receipt?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove line");
      setReceipt((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
      }));
      toast.success("Line removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove line");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 surface rounded-2xl p-4">
        <label className="text-sm">
          Store
          <select
            className="select mt-1"
            disabled={busy}
            value={receipt.locationId ?? ""}
            onChange={(e) =>
              void saveMeta({ locationId: e.target.value || null })
            }
          >
            <option value="">Unknown</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Purchase date
          <input
            type="date"
            className="input mt-1"
            disabled={busy}
            defaultValue={toDateInput(receipt.purchasedAt)}
            onBlur={(e) => {
              const next = e.target.value
                ? new Date(`${e.target.value}T12:00:00`).toISOString()
                : null;
              if (next && next.slice(0, 10) !== receipt.purchasedAt.slice(0, 10)) {
                void saveMeta({ purchasedAt: next });
              }
            }}
          />
        </label>
        <label className="text-sm">
          Tax
          <input
            type="number"
            step="0.01"
            className="input mt-1"
            disabled={busy}
            defaultValue={receipt.tax}
            onBlur={(e) => {
              const tax = Number(e.target.value || 0);
              if (tax !== receipt.tax) {
                void saveMeta({
                  tax,
                  total: Number((receipt.subtotal + tax).toFixed(2)),
                });
              }
            }}
          />
        </label>
      </div>

      <ul className="divide-y divide-black/8">
        {receipt.items.map((item) => (
          <li key={item.id} className="py-3 space-y-2">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                {item.product ? (
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium hover:text-tj-red"
                  >
                    {item.product.name}
                  </Link>
                ) : (
                  <span className="font-medium">{item.rawName}</span>
                )}
                {!item.product && (
                  <p className="text-xs text-tj-red mt-0.5">Not linked to a product</p>
                )}
                <p className="text-sm text-tj-muted">
                  {item.quantity} × ${item.unitPrice.toFixed(2)}
                  {item.product && item.rawName !== item.product.name
                    ? ` · raw: ${item.rawName}`
                    : ""}
                </p>
              </div>
              <span className="font-semibold">${item.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary text-xs py-1.5"
                disabled={busy}
                onClick={() => {
                  setLinkingId(linkingId === item.id ? null : item.id);
                  setLinkQuery(item.rawName);
                }}
              >
                {item.product ? "Change product" : "Link product"}
              </button>
              {item.product && (
                <button
                  type="button"
                  className="btn btn-secondary text-xs py-1.5 text-tj-muted"
                  disabled={busy}
                  onClick={() => void linkItem(item.id, null)}
                >
                  Unlink
                </button>
              )}
              <button
                type="button"
                className="btn text-xs py-1.5 text-tj-red border border-tj-red/25 bg-tj-red/5 hover:bg-tj-red/10"
                disabled={busy}
                onClick={() => void removeItem(item.id)}
              >
                Remove line
              </button>
            </div>
            {linkingId === item.id && (
              <div className="surface rounded-xl p-3 space-y-2">
                <input
                  className="input"
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  placeholder="Search products…"
                  autoFocus
                />
                <ul className="max-h-40 overflow-auto divide-y divide-black/5">
                  {linkMatches.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left px-2 py-2 text-sm hover:bg-black/5"
                        onClick={() => void linkItem(item.id, p.id)}
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                  {!linkMatches.length && (
                    <li className="px-2 py-2 text-sm text-tj-muted">No matches</li>
                  )}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-black/10 pt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-tj-muted">Subtotal</span>
          <span>${receipt.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tj-muted">Tax</span>
          <span>${receipt.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold pt-1">
          <span>Total</span>
          <span>${receipt.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-secondary text-tj-red border-tj-red/30"
          disabled={busy}
          onClick={() => void deleteReceipt()}
        >
          Delete receipt
        </button>
      </div>

      {receipt.rawText && (
        <details className="surface rounded-2xl p-4">
          <summary className="cursor-pointer font-medium">Raw receipt text</summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-tj-muted font-mono">
            {receipt.rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
