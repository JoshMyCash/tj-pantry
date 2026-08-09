export function DatabaseSetup({ detail }: { detail?: string }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16">
      <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
        TJ Pantry
      </p>
      <h1 className="text-xl font-semibold text-[var(--ink)]">
        Database isn’t connected yet
      </h1>
      <p className="text-[var(--muted)] leading-relaxed">
        The app deployed, but Vercel has no{" "}
        <code className="text-[var(--ink)]">DATABASE_URL</code> for runtime.
        Add your Prisma Postgres connection string in Vercel → Project Settings
        → Environment Variables (Production + Preview, Build + Runtime), then
        redeploy.
      </p>
      {detail ? (
        <pre className="overflow-x-auto rounded-md bg-black/5 p-3 text-xs text-[var(--muted)]">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
