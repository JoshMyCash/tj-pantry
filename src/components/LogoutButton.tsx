"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-tj-muted transition hover:bg-black/5 hover:text-tj-ink disabled:opacity-60"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
