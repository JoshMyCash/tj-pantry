import Link from "next/link";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";
import { money, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CostsPage() {
  const [receipts, favorites, averages, aggregates] = await Promise.all([
    prisma.receipt.findMany({
      orderBy: { purchasedAt: "desc" },
      select: {
        id: true,
        total: true,
        purchasedAt: true,
        location: { select: { name: true } },
      },
    }),
    prisma.product.findMany({
      where: { liked: true, tried: true, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    averagePricesByProduct(),
    prisma.receipt.aggregate({
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
  ]);

  const totalSpent = aggregates._sum.total ?? 0;
  const avgTrip = aggregates._avg.total ?? 0;
  const favoritesEstimate = favorites.reduce(
    (s, p) => s + (averages.get(p.id) ?? 0),
    0,
  );

  const byMonth = new Map<string, number>();
  for (const r of receipts) {
    const key = r.purchasedAt.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.total);
  }

  return (
    <div className="space-y-10">
      <header className="animate-rise">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
          TJ Pantry
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl mt-2">
          Cost estimator
        </h1>
        <p className="mt-2 text-tj-muted max-w-xl">
          Totals from imported receipts, plus what a regular favorites run would cost at your average paid prices.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-3 animate-rise-delay">
        <Stat label="All-time spend" value={money(totalSpent)} />
        <Stat label="Average trip" value={money(avgTrip)} />
        <Stat label="Favorites run estimate" value={money(favoritesEstimate)} />
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl mb-3">
          By month
        </h2>
        <ul className="divide-y divide-black/8 max-w-md">
          {[...byMonth.entries()]
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, amount]) => (
              <li key={month} className="flex justify-between py-2">
                <span>{month}</span>
                <span className="font-semibold">{money(amount)}</span>
              </li>
            ))}
          {!byMonth.size && (
            <li className="text-tj-muted py-2">Import receipts to see monthly spend.</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl mb-3">
          Favorites priced from receipts
        </h2>
        <ul className="divide-y divide-black/8">
          {favorites.map((p) => (
            <li key={p.id} className="flex justify-between py-2">
              <Link href={`/products/${p.id}`} className="hover:text-tj-red">
                {p.name}
              </Link>
              <span>
                {averages.has(p.id) ? money(averages.get(p.id)) : "No price yet"}
              </span>
            </li>
          ))}
          {!favorites.length && (
            <li className="text-tj-muted py-2">
              Like products you&apos;ve tried to build this estimate.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl mb-3">
          Recent trips
        </h2>
        <ul className="divide-y divide-black/8">
          {receipts.slice(0, 8).map((r) => (
            <li key={r.id}>
              <Link
                href={`/receipts/${r.id}`}
                className="flex justify-between py-2 hover:text-tj-red"
              >
                <span>
                  {fmtDate(r.purchasedAt)}
                  <span className="text-tj-muted">
                    {" "}
                    · {r.location?.name ?? "Unknown"}
                  </span>
                </span>
                <span className="font-semibold">{money(r.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-tj-red pl-4">
      <p className="text-sm text-tj-muted">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-3xl mt-1">{value}</p>
    </div>
  );
}
