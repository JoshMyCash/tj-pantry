"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StarRating } from "@/components/StarRating";
import { useToast } from "@/components/Toast";

type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  calories: number | null;
  servingSize: string | null;
  status: "ACTIVE" | "ARCHIVED" | "CANT_FIND";
  rating: number | null;
  tried: boolean;
  liked: boolean;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER" | null;
  notes: string;
  openFoodFactsId: string | null;
};

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const toast = useToast();
  const [p, setP] = useState(product);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"ok" | "err">("ok");

  async function patch(data: Partial<Product>) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const next = await res.json();
      setP(next);
      router.refresh();
    } catch (e) {
      setMsgTone("err");
      setMsg(e instanceof Error ? e.message : "Error");
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function enrich() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/products/${p.id}/enrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No match");
      setP(data.product);
      setMsgTone("ok");
      setMsg("Pulled image & calories from Open Food Facts");
      toast.success("Found image & calories");
      router.refresh();
    } catch (e) {
      setMsgTone("err");
      setMsg(e instanceof Error ? e.message : "Error");
      toast.error(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct() {
    if (!window.confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            "Could not delete — it may still be on a list or receipt. Archive instead.",
        );
      }
      toast.success("Product deleted");
      router.push("/products");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            width={192}
            height={192}
            loading="eager"
            decoding="async"
            className="h-48 w-48 rounded-2xl object-cover bg-white shadow-sm"
          />
        ) : (
          <div className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-gradient-to-br from-white to-tj-mist text-tj-muted">
            <span className="font-[family-name:var(--font-display)] text-3xl text-tj-red/70">
              TJ
            </span>
            <span className="text-sm">No image yet</span>
          </div>
        )}
        <div className="flex-1 space-y-3">
          <p className="text-sm text-tj-muted">{p.brand}</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl">{p.name}</h1>
          <StarRating
            value={p.rating}
            onChange={(rating) => patch({ rating, tried: true })}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${p.tried ? "btn-primary" : "btn-secondary"}`}
              disabled={busy}
              onClick={() => patch({ tried: !p.tried })}
            >
              {p.tried ? "Tried" : "Mark tried"}
            </button>
            <button
              type="button"
              className={`btn ${p.liked ? "btn-primary" : "btn-secondary"}`}
              disabled={busy}
              onClick={() => patch({ liked: !p.liked, tried: true })}
            >
              {p.liked ? "Liked" : "Like"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={enrich}
            >
              {busy ? "Working…" : "Find image & calories"}
            </button>
          </div>
          {msg && (
            <p
              className={`text-sm ${msgTone === "ok" ? "text-tj-leaf" : "text-tj-red"}`}
              role={msgTone === "err" ? "alert" : undefined}
            >
              {msg}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 surface rounded-2xl p-5">
        <label className="text-sm">
          Status
          <select
            className="select mt-1"
            value={p.status}
            disabled={busy}
            onChange={(e) =>
              patch({ status: e.target.value as Product["status"] })
            }
          >
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="CANT_FIND">Can&apos;t find</option>
          </select>
        </label>
        <label className="text-sm">
          Meal
          <select
            className="select mt-1"
            value={p.mealType ?? ""}
            disabled={busy}
            onChange={(e) =>
              patch({
                mealType: (e.target.value || null) as Product["mealType"],
              })
            }
          >
            <option value="">Unassigned</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
            <option value="SNACK">Snack</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label className="text-sm">
          Calories
          <input
            type="number"
            className="input mt-1"
            defaultValue={p.calories ?? ""}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== p.calories) patch({ calories: v });
            }}
          />
        </label>
        <label className="text-sm">
          Serving size
          <input
            className="input mt-1"
            defaultValue={p.servingSize ?? ""}
            onBlur={(e) => {
              const v = e.target.value || null;
              if (v !== p.servingSize) patch({ servingSize: v });
            }}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Notes
          <textarea
            className="textarea mt-1 min-h-24"
            defaultValue={p.notes}
            onBlur={(e) => {
              if (e.target.value !== p.notes) patch({ notes: e.target.value });
            }}
          />
        </label>
        {p.openFoodFactsId && (
          <p className="text-xs text-tj-muted sm:col-span-2">
            Open Food Facts code: {p.openFoodFactsId}
          </p>
        )}
        <button
          type="button"
          className="btn btn-secondary text-tj-red border-tj-red/30 sm:col-span-2"
          disabled={busy}
          onClick={() => void deleteProduct()}
        >
          Delete product
        </button>
      </div>
    </div>
  );
}
