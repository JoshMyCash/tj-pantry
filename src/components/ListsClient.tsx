"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { EmptyState } from "@/components/EmptyState";

type Location = { id: string; name: string };
type List = {
  id: string;
  name: string;
  notes: string;
  estimate: number;
  location: Location | null;
  itemCount: number;
};

export function ListsClient({
  lists,
  locations,
}: {
  lists: List[];
  locations: Location[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createList(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
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
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create list");
      toast.success("List created");
      router.push(`/lists/${data.id}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create list";
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  async function deleteList(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This can’t be undone.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not delete list");
      }
      toast.success("List deleted");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete list";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
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
        {error && (
          <p className="text-sm text-tj-red sm:col-span-2" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary sm:col-span-2" disabled={busy}>
          {busy ? "Creating…" : "Create grocery list"}
        </button>
      </form>

      <ul className="divide-y divide-black/8">
        {lists.map((list) => (
          <li
            key={list.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 py-3"
          >
            <Link href={`/lists/${list.id}`} className="min-w-0 flex-1 hover:text-tj-red">
              <p className="font-semibold">{list.name}</p>
              <p className="text-sm text-tj-muted">
                {list.location?.name ?? "Any store"} · {list.itemCount} items
              </p>
            </Link>
            <div className="flex items-center gap-4 shrink-0">
              <p className="min-w-[4.5rem] text-right font-semibold tabular-nums">
                ~${list.estimate.toFixed(2)}
              </p>
              <button
                type="button"
                className="inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-tj-red hover:bg-tj-red/5"
                disabled={deletingId === list.id}
                onClick={() => void deleteList(list.id, list.name)}
              >
                {deletingId === list.id ? "…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!lists.length && (
        <EmptyState
          title="No lists yet"
          body="Create a weekly run pre-filled from liked & tried products."
        />
      )}
    </div>
  );
}
