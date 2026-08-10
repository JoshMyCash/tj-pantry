"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

export function ProductFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<number | null>(null);

  const activeCount = useMemo(() => {
    let n = 0;
    for (const key of ["q", "status", "meal", "liked", "tried"]) {
      if (sp.get(key)) n += 1;
    }
    return n;
  }, [sp]);

  function applyFilters() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const params = new URLSearchParams();
    for (const key of ["q", "status", "meal", "liked", "tried"]) {
      const v = String(fd.get(key) ?? "");
      if (v) params.set(key, v);
    }
    const next = params.toString();
    const current = sp.toString();
    if (next === current) return;
    start(() => router.replace(next ? `/products?${next}` : "/products"));
  }

  function scheduleApply() {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => applyFilters(), 220);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
      }}
      className="surface rounded-2xl p-4 space-y-3"
    >
      <label className="block text-sm">
        Search
        <input
          name="q"
          defaultValue={sp.get("q") ?? ""}
          className="input mt-1"
          placeholder="Mandarin chicken…"
          onChange={scheduleApply}
        />
      </label>

      <div className="flex items-center justify-between gap-3 md:hidden">
        <p className="text-sm text-tj-muted">
          {activeCount
            ? `${activeCount} filter${activeCount === 1 ? "" : "s"} active`
            : "More filters"}
        </p>
        <button
          type="button"
          className="btn btn-secondary px-3 py-2 text-sm"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide filters" : "Show filters"}
        </button>
      </div>

      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end ${
          open ? "grid" : "hidden md:grid"
        }`}
      >
        <label className="text-sm">
          Status
          <select
            name="status"
            defaultValue={sp.get("status") ?? ""}
            className="select mt-1"
            onChange={applyFilters}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
            <option value="CANT_FIND">Can&apos;t find</option>
          </select>
        </label>
        <label className="text-sm">
          Meal
          <select
            name="meal"
            defaultValue={sp.get("meal") ?? ""}
            className="select mt-1"
            onChange={applyFilters}
          >
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
          <select
            name="liked"
            defaultValue={sp.get("liked") ?? ""}
            className="select mt-1"
            onChange={applyFilters}
          >
            <option value="">Any</option>
            <option value="1">Liked only</option>
          </select>
        </label>
        <label className="text-sm">
          Tried
          <select
            name="tried"
            defaultValue={sp.get("tried") ?? ""}
            className="select mt-1"
            onChange={applyFilters}
          >
            <option value="">Any</option>
            <option value="1">Tried only</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-tj-muted">
        {pending ? "Updating…" : "Filters update as you type."}
      </p>
    </form>
  );
}
