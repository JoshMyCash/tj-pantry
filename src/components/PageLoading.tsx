export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="animate-rise space-y-6 py-6" role="status" aria-live="polite">
      <div className="h-3 w-24 rounded bg-black/10" />
      <div className="h-10 w-56 max-w-full rounded bg-black/10" />
      <div className="h-4 w-full max-w-md rounded bg-black/8" />
      <div className="mt-8 space-y-3">
        <div className="h-16 rounded-2xl bg-white/60 border border-black/5" />
        <div className="h-16 rounded-2xl bg-white/60 border border-black/5" />
        <div className="h-16 rounded-2xl bg-white/60 border border-black/5" />
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
