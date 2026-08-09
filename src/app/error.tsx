"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const missingDb =
    /DATABASE_URL|Postgres connection string|No Postgres/i.test(
      error.message ?? "",
    );

  return (
    <div className="mx-auto max-w-xl space-y-4 py-16">
      <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
        TJ Pantry
      </p>
      <h1 className="text-xl font-semibold">
        {missingDb ? "Database isn’t connected yet" : "Something went wrong"}
      </h1>
      <p className="text-[var(--muted)] leading-relaxed">
        {missingDb
          ? "Add DATABASE_URL in Vercel → Settings → Environment Variables (Production + Preview, Build + Runtime), then redeploy."
          : "A server error occurred. Reload to try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-[var(--ink)] px-4 py-2 text-sm text-white"
      >
        Reload
      </button>
    </div>
  );
}
