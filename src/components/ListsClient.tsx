"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string };
type List = {
  id: string;
  name: string;
  notes: string;
  estimate: number;
  location: Location | null;
  items: { id: string }[];
};

export function ListsClient({
  lists,
  locations,
}: {
  lists: List[];
  locations: Location[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function createList(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") ?? "Weekly run"),
        locationId: String(fd.get("locationId") || "") || null,
        fromFavorites: fd.get("fromFavorites") === "on",
        notes: String(fd.get("notes") ?? ""),
      }),
    });
    setBusy(false);
    if (!res.ok) return;
    const list = await res.json();
    router.push(`/lists/${list.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createList} className="surface rounded-2xl p-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          List name
          <input name="name" className="input mt-1" defaultValue="Weekly favorites" required />
        </label>
        <label className="text-sm">
          Store
          <select name="locationId" className="select mt-1">
            <option value="">Any</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Notes
          <input name="notes" className="input mt-1" placeholder="Restock frozen aisle first" />
        </label>
        <label className="text-sm flex items-center gap-2 sm:col-span-2">
          <input name="fromFavorites" type="checkbox" defaultChecked />
          Pre-fill with liked & tried products
        </label>
        <button type="submit" className="btn btn-primary sm:col-span-2" disabled={busy}>
          {busy ? "Creating…" : "Create grocery list"}
        </button>
      </form>

      <ul className="divide-y divide-black/8">
        {lists.map((list) => (
          <li key={list.id}>
            <Link
              href={`/lists/${list.id}`}
              className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-tj-red"
            >
              <div>
                <p className="font-semibold">{list.name}</p>
                <p className="text-sm text-tj-muted">
                  {list.location?.name ?? "Any store"} · {list.items.length} items
                </p>
              </div>
              <p className="font-semibold">
                ~${list.estimate.toFixed(2)}
              </p>
            </Link>
          </li>
        ))}
        {!lists.length && (
          <li className="py-6 text-tj-muted">No lists yet — create one from your favorites.</li>
        )}
      </ul>
    </div>
  );
}
