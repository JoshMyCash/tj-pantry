"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  mealType: string | null;
  status: string;
};

type Item = {
  id: string;
  quantity: number;
  checked: boolean;
  mealType: string | null;
  product: Product;
  productId: string;
};

const MEALS = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER", null] as const;

function label(m: string | null) {
  if (!m) return "Unassigned";
  return m.charAt(0) + m.slice(1).toLowerCase();
}

export function ListDetailClient({
  listId,
  initialItems,
  products,
  estimate,
}: {
  listId: string;
  initialItems: Item[];
  products: Product[];
  estimate: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "ACTIVE"),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? activeProducts.filter((p) => p.name.toLowerCase().includes(q))
      : activeProducts;
    return pool.slice(0, 80);
  }, [activeProducts, query]);

  const selectedProductId = productId || filteredProducts[0]?.id || "";

  const liveEstimate = useMemo(() => {
    // Keep server estimate as baseline; adjust only for checked visual weight isn’t needed.
    return estimate;
  }, [estimate]);

  const grouped = useMemo(() => {
    const uncheckedFirst = [...items].sort((a, b) => Number(a.checked) - Number(b.checked));
    return MEALS.map((meal) => ({
      meal,
      items: uncheckedFirst.filter((i) => (i.mealType ?? null) === meal),
    })).filter((g) => g.items.length > 0 || mealSectionAlways(g.meal, items));
  }, [items]);

  async function toggle(item: Item) {
    setError(null);
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    if (!res.ok) {
      setError("Could not update item.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function setMeal(item: Item, mealType: string | null) {
    setError(null);
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType }),
    });
    if (!res.ok) {
      setError("Could not update meal.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function setQuantity(item: Item, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    setError(null);
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      setError("Could not update quantity.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
    router.refresh();
  }

  async function remove(item: Item) {
    setError(null);
    const res = await fetch(`/api/lists/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Could not remove item.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.refresh();
  }

  async function addProduct() {
    if (!selectedProductId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not add product");
      setItems((prev) => [...prev, data]);
      setQuery("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setBusy(false);
    }
  }

  async function clearChecked() {
    const checked = items.filter((i) => i.checked);
    if (!checked.length) return;
    setBusy(true);
    setError(null);
    try {
      await Promise.all(
        checked.map((item) =>
          fetch(`/api/lists/items/${item.id}`, { method: "DELETE" }),
        ),
      );
      setItems((prev) => prev.filter((i) => !i.checked));
      router.refresh();
    } catch {
      setError("Could not clear checked items.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-tj-muted">
          Estimated from receipt averages:{" "}
          <span className="font-semibold text-tj-ink">${liveEstimate.toFixed(2)}</span>
        </p>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          disabled={busy || !items.some((i) => i.checked)}
          onClick={() => void clearChecked()}
        >
          Clear checked
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm flex-1 min-w-[160px]">
          Search products
          <input
            className="input mt-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setProductId("");
            }}
            placeholder="Type to filter…"
          />
        </label>
        <label className="text-sm flex-[2] min-w-[200px]">
          Add product
          <select
            className="select mt-1"
            value={selectedProductId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {!filteredProducts.length && <option value="">No matches</option>}
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || !selectedProductId}
          onClick={() => void addProduct()}
        >
          Add
        </button>
      </div>

      {error && (
        <p className="text-sm text-tj-red" role="alert">
          {error}
        </p>
      )}

      {grouped.map((group) => (
        <section key={String(group.meal)}>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-2">
            {label(group.meal)}
          </h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 border-b border-black/8 py-2"
              >
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => void toggle(item)}
                    aria-label={`Mark ${item.product.name} checked`}
                  />
                </label>
                <Link
                  href={`/products/${item.productId}`}
                  className={`flex-1 min-w-[8rem] font-medium hover:text-tj-red ${
                    item.checked ? "line-through text-tj-muted" : ""
                  }`}
                >
                  {item.product.name}
                </Link>
                <label className="text-xs text-tj-muted">
                  Qty
                  <input
                    type="number"
                    min={0.1}
                    step={0.5}
                    className="input mt-0.5 w-20"
                    defaultValue={item.quantity}
                    onBlur={(e) => {
                      const q = Number(e.target.value);
                      if (q !== item.quantity) void setQuantity(item, q);
                    }}
                  />
                </label>
                <select
                  className="select w-auto"
                  aria-label={`Meal for ${item.product.name}`}
                  value={item.mealType ?? ""}
                  onChange={(e) => void setMeal(item, e.target.value || null)}
                >
                  <option value="">Unassigned</option>
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="DINNER">Dinner</option>
                  <option value="SNACK">Snack</option>
                  <option value="OTHER">Other</option>
                </select>
                <button
                  type="button"
                  className="text-xs font-semibold text-tj-red"
                  onClick={() => void remove(item)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!items.length && (
        <p className="text-tj-muted">This list is empty — add favorites or products above.</p>
      )}
    </div>
  );
}

function mealSectionAlways(meal: string | null, items: Item[]) {
  return items.length === 0 && meal === null;
}
