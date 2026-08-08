"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";

export function ProductFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "status", "meal", "liked", "tried"]) {
      const v = String(fd.get(key) ?? "");
      if (v) params.set(key, v);
    }
    start(() => router.push(`/products?${params.toString()}`));
  }

  return (
    <form onSubmit={onSubmit} className="surface rounded-2xl p-4 grid gap-3 sm:grid-cols-6 items-end">
      <label className="sm:col-span-2 text-sm">
        Search
        <input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          className="input mt-1"
          placeholder="Mandarin chicken…"
        />
      </label>
      <label className="text-sm">
        Status
        <select name="status" defaultValue={sp.get("status") ?? ""} className="select mt-1">
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
          <option value="CANT_FIND">Can&apos;t find</option>
        </select>
      </label>
      <label className="text-sm">
        Meal
        <select name="meal" defaultValue={sp.get("meal") ?? ""} className="select mt-1">
          <option value="">All</option>
          <option value="BREAKFAST">Breakfast</option>
          <option value="LUNCH">Lunch</option>
          <option value="DINNER">Dinner</option>
          <option value="SNACK">Snack</option>
          <option value="OTHER">Other</option>
        </select>
      </label>
      <label className="text-sm">
        Liked
        <select name="liked" defaultValue={sp.get("liked") ?? ""} className="select mt-1">
          <option value="">Any</option>
          <option value="1">Liked only</option>
        </select>
      </label>
      <button type="submit" className="btn btn-secondary" disabled={pending}>
        {pending ? "Filtering…" : "Filter"}
      </button>
    </form>
  );
}
