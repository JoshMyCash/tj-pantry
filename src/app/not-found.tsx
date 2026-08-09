import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center animate-rise">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
        TJ Pantry
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-tj-muted">
        That link doesn&apos;t match anything in your pantry.
      </p>
      <Link href="/" className="btn btn-primary mt-8 inline-flex">
        Back home
      </Link>
    </div>
  );
}
