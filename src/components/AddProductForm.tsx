"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AddProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      mealType: String(fd.get("mealType") || "") || null,
      calories: fd.get("calories") ? Number(fd.get("calories")) : null,
      tried: fd.get("tried") === "on",
      liked: fd.get("liked") === "on",
    };
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Could not create product");
      const product = await res.json();
      e.currentTarget.reset();
      setOpen(false);
      router.push(`/products/${product.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        {open ? "Close form" : "Add product"}
      </button>
      {open && (
        <form onSubmit={onSubmit} className="mt-4 surface rounded-2xl p-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            Name
            <input name="name" required className="input mt-1" placeholder="Unexpected Cheddar" />
          </label>
          <label className="text-sm">
            Meal
            <select name="mealType" className="select mt-1">
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
            <input name="calories" type="number" min={0} className="input mt-1" />
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input name="tried" type="checkbox" /> Tried
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input name="liked" type="checkbox" /> Liked
          </label>
          {error && <p className="text-sm text-tj-red sm:col-span-2">{error}</p>}
          <button type="submit" className="btn btn-primary sm:col-span-2" disabled={busy}>
            {busy ? "Saving…" : "Save product"}
          </button>
        </form>
      )}
    </div>
  );
}
