"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/Toast";

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
  listName,
  initialItems,
  products,
  priceByProduct,
}: {
  listId: string;
  listName: string;
  initialItems: Item[];
  products: Product[];
  priceByProduct: Record<string, number>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState("");
  const [busy, setBusy] = useState(false);

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

  const estimate = useMemo(
    () =>
      Number(
        items
          .reduce(
            (s, item) => s + (priceByProduct[item.productId] ?? 0) * item.quantity,
            0,
          )
          .toFixed(2),
      ),
    [items, priceByProduct],
  );

  const remainingEstimate = useMemo(
    () =>
      Number(
        items
          .filter((i) => !i.checked)
          .reduce(
            (s, item) => s + (priceByProduct[item.productId] ?? 0) * item.quantity,
            0,
          )
          .toFixed(2),
      ),
    [items, priceByProduct],
  );

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length ? checkedCount / items.length : 0;

  const openGrouped = useMemo(() => {
    const open = items.filter((i) => !i.checked);
    return MEALS.map((meal) => ({
      meal,
      items: open.filter((i) => (i.mealType ?? null) === meal),
    })).filter((g) => g.items.length > 0);
  }, [items]);

  const doneItems = useMemo(
    () => items.filter((i) => i.checked),
    [items],
  );

  async function toggle(item: Item) {
    const previous = items;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)),
    );
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
    if (!res.ok) {
      setItems(previous);
      toast.error("Could not update item.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function setMeal(item: Item, mealType: string | null) {
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealType }),
    });
    if (!res.ok) {
      toast.error("Could not update meal.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function setQuantity(item: Item, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const res = await fetch(`/api/lists/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      toast.error("Could not update quantity.");
      return;
    }
    const next = await res.json();
    setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)));
  }

  async function remove(item: Item) {
    const res = await fetch(`/api/lists/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove item.");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Removed from list");
    router.refresh();
  }

  async function addProduct() {
    if (!selectedProductId) return;
    setBusy(true);
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
      toast.success("Added to list");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setBusy(false);
    }
  }

  async function clearChecked() {
    const checked = items.filter((i) => i.checked);
    if (!checked.length) return;
    setBusy(true);
    try {
      const results = await Promise.all(
        checked.map((item) =>
          fetch(`/api/lists/items/${item.id}`, { method: "DELETE" }),
        ),
      );
      if (results.some((r) => !r.ok)) {
        throw new Error("Could not clear all checked items.");
      }
      setItems((prev) => prev.filter((i) => !i.checked));
      toast.success("Cleared checked items");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not clear checked items.");
    } finally {
      setBusy(false);
    }
  }

  function shareText() {
    const lines = items
      .filter((i) => !i.checked)
      .map((i) => `□ ${i.product.name}${i.quantity !== 1 ? ` × ${i.quantity}` : ""}`);
    return [`${listName}`, "", ...lines, "", `Remaining ~$${remainingEstimate.toFixed(2)}`].join(
      "\n",
    );
  }

  async function shareList() {
    const text = shareText();
    try {
      if (navigator.share) {
        await navigator.share({ title: listName, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("List copied to clipboard");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("List copied to clipboard");
      } catch {
        toast.error("Could not share list");
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="list-chrome sticky top-[3.6rem] z-30 -mx-4 border-b border-black/5 bg-[rgba(247,250,252,0.95)] px-4 py-3 backdrop-blur-md md:top-[3.75rem]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-tj-muted">
              {checkedCount}/{items.length || 0} checked
              {items.length ? ` · ${Math.round(progress * 100)}%` : ""}
            </p>
            <p className="text-sm text-tj-ink">
              Remaining ~${remainingEstimate.toFixed(2)}
              <span className="text-tj-muted"> · full ~${estimate.toFixed(2)}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" className="btn btn-secondary text-sm" onClick={() => window.print()}>
              Print
            </button>
            <button type="button" className="btn btn-secondary text-sm" onClick={() => void shareList()}>
              Share
            </button>
            <button
              type="button"
              className="btn btn-secondary text-sm"
              disabled={busy || !doneItems.length}
              onClick={() => void clearChecked()}
            >
              Clear checked
            </button>
          </div>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-tj-leaf transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-end print:hidden">
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

      {openGrouped.map((group) => (
        <section key={String(group.meal)}>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-2">
            {label(group.meal)}
          </h2>
          <ul className="space-y-2">
            {group.items.map((item) => (
              <ListRow
                key={item.id}
                item={item}
                onToggle={() => void toggle(item)}
                onMeal={(m) => void setMeal(item, m)}
                onQty={(q) => void setQuantity(item, q)}
                onRemove={() => void remove(item)}
              />
            ))}
          </ul>
        </section>
      ))}

      {doneItems.length > 0 && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-2 text-tj-muted">
            Done
          </h2>
          <ul className="space-y-2">
            {doneItems.map((item) => (
              <ListRow
                key={item.id}
                item={item}
                onToggle={() => void toggle(item)}
                onMeal={(m) => void setMeal(item, m)}
                onQty={(q) => void setQuantity(item, q)}
                onRemove={() => void remove(item)}
              />
            ))}
          </ul>
        </section>
      )}

      {!items.length && (
        <div className="surface rounded-2xl px-5 py-8 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl">This list is empty</p>
          <p className="mt-2 text-sm text-tj-muted">
            Add favorites above, or create a list pre-filled from liked products.
          </p>
          <Link href="/lists" className="btn btn-primary mt-5 inline-flex">
            Back to lists
          </Link>
        </div>
      )}
    </div>
  );
}

function ListRow({
  item,
  onToggle,
  onMeal,
  onQty,
  onRemove,
}: {
  item: Item;
  onToggle: () => void;
  onMeal: (meal: string | null) => void;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="border-b border-black/8 py-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/5"
          aria-pressed={item.checked}
          aria-label={`Mark ${item.product.name} ${item.checked ? "unchecked" : "checked"}`}
        >
          <input
            type="checkbox"
            checked={item.checked}
            readOnly
            tabIndex={-1}
            className="pointer-events-none h-5 w-5"
          />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`min-w-0 flex-1 text-left font-medium ${
            item.checked ? "line-through text-tj-muted" : "hover:text-tj-red"
          }`}
        >
          {item.product.name}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-14 print:hidden">
        <Link
          href={`/products/${item.productId}`}
          className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-tj-muted hover:bg-black/5 hover:text-tj-red"
        >
          Details
        </Link>
        <label className="text-xs text-tj-muted inline-flex items-center gap-1.5">
          Qty
          <input
            type="number"
            min={0.1}
            step={0.5}
            className="input w-20 py-1.5"
            defaultValue={item.quantity}
            onBlur={(e) => {
              const q = Number(e.target.value);
              if (q !== item.quantity) onQty(q);
            }}
          />
        </label>
        <select
          className="select w-auto py-1.5"
          aria-label={`Meal for ${item.product.name}`}
          value={item.mealType ?? ""}
          onChange={(e) => onMeal(e.target.value || null)}
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
          className="ml-auto inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-tj-red hover:bg-tj-red/5"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
