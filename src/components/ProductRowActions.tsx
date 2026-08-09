"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";

export function ProductRowActions({
  id,
  status,
}: {
  id: string;
  status: "ACTIVE" | "ARCHIVED" | "CANT_FIND";
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: "ACTIVE" | "ARCHIVED" | "CANT_FIND") {
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Could not update product");
      toast.success(
        next === "ACTIVE"
          ? "Restored"
          : next === "ARCHIVED"
            ? "Archived"
            : "Marked can’t find",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.preventDefault()}>
      {status === "ACTIVE" ? (
        <>
          <button
            type="button"
            className="text-xs font-semibold text-tj-muted hover:text-tj-ink"
            disabled={busy}
            onClick={() => void setStatus("ARCHIVED")}
          >
            Archive
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-tj-muted hover:text-tj-ink"
            disabled={busy}
            onClick={() => void setStatus("CANT_FIND")}
          >
            Can&apos;t find
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-xs font-semibold text-tj-red"
          disabled={busy}
          onClick={() => void setStatus("ACTIVE")}
        >
          Restore
        </button>
      )}
    </div>
  );
}
