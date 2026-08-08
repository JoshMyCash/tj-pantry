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
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    return MEALS.map((meal) => ({
      meal,
      items: items.filter((i) => (i.mealType ?? null) === meal),
    })).filter((g) => g.items.length > 0 || mealSectionAlways(g.meal, items));
  }, [items]);

  async function toggle(item: Item) {
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    if (!res.ok) return;
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function setMeal(item: Item, mealType: string | null) {
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType }),
    });
    if (!res.ok) return;
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function remove(item: Item) {
    await fetch(`/api/lists/items/${item.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    router.refresh();
  }

  async function addProduct() {
    if (!productId) return;
    setBusy(true);
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setBusy(false);
    if (!res.ok) return;
    const item = await res.json();
    setItems((prev) => [...prev, item]);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="text-tj-muted">
        Estimated from receipt averages:{" "}
        <span className="font-semibold text-tj-ink">${estimate.toFixed(2)}</span>
      </p>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-sm flex-1 min-w-[200px]">
          Add product
          <select
            className="select mt-1"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products
              .filter((p) => p.status === "ACTIVE")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void addProduct()}>
          Add
        </button>
      </div>

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
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => void toggle(item)}
                />
                <Link
                  href={`/products/${item.productId}`}
                  className={`flex-1 font-medium hover:text-tj-red ${
                    item.checked ? "line-through text-tj-muted" : ""
                  }`}
                >
                  {item.product.name}
                </Link>
                <select
                  className="select w-auto"
                  value={item.mealType ?? ""}
                  onChange={(e) =>
                    void setMeal(item, e.target.value || null)
                  }
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
