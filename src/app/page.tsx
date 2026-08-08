import Link from "next/link";
import { prisma } from "@/lib/db";
import { money, crowdLabel } from "@/lib/format";
import { averagePricesByProduct } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [productCount, liked, receipts, locations, lists] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.findMany({
      where: { liked: true, tried: true, status: "ACTIVE" },
      take: 6,
      orderBy: { rating: "desc" },
    }),
    prisma.receipt.findMany({
      take: 3,
      orderBy: { purchasedAt: "desc" },
      include: { location: true, items: true },
    }),
    prisma.location.findMany({ take: 3, orderBy: { name: "asc" } }),
    prisma.groceryList.findMany({
      take: 2,
      orderBy: { updatedAt: "desc" },
      include: { items: true },
    }),
  ]);

  const averages = await averagePricesByProduct();
  const favoritesEstimate = liked.reduce(
    (s, p) => s + (averages.get(p.id) ?? 0),
    0,
  );
  const spent = receipts.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-none min-h-[70vh] flex flex-col justify-end pb-10 pt-16">
        <div
          className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_at_70%_20%,rgba(200,16,46,0.18),transparent_55%),linear-gradient(135deg,#1c2430_0%,#2f6b4f_55%,#c8102e_120%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 -mx-4 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 80h160M80 0v160' stroke='%23fff' stroke-opacity='.08' stroke-width='1'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />
        <div className="relative z-10 max-w-2xl text-white px-1 animate-rise">
          <p className="brand-mark font-[family-name:var(--font-display)] text-5xl sm:text-7xl leading-[0.95] tracking-tight">
            TJ Pantry
          </p>
          <h1 className="mt-5 text-xl sm:text-2xl font-medium text-white/90 max-w-lg animate-rise-delay">
            Your Trader Joe’s finds, ratings, and regular run — in one place.
          </h1>
          <p className="mt-3 text-white/70 max-w-md animate-rise-delay">
            Import receipts, enrich calories from Open Food Facts, and build lists from what you actually like.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise-delay-2">
            <Link href="/receipts" className="btn btn-primary">
              Import a receipt
            </Link>
            <Link
              href="/products"
              className="btn bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              Browse products
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3 animate-rise">
        <Stat label="Active products" value={String(productCount)} />
        <Stat label="Recent trip spend" value={money(spent)} />
        <Stat
          label="Favorites list estimate"
          value={money(favoritesEstimate)}
        />
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-tj-ink">
              Liked & tried
            </h2>
            <Link href="/lists" className="text-sm font-semibold text-tj-red">
              Make a list →
            </Link>
          </div>
          <ul className="space-y-3">
            {liked.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between gap-3 border-b border-black/8 py-2 hover:text-tj-red"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-tj-sun text-sm">
                    {"★".repeat(p.rating ?? 0)}
                  </span>
                </Link>
              </li>
            ))}
            {!liked.length && (
              <p className="text-tj-muted">Rate a few products to fill this in.</p>
            )}
          </ul>
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-tj-ink">
              Your stores
            </h2>
            <Link href="/locations" className="text-sm font-semibold text-tj-red">
              Manage →
            </Link>
          </div>
          <ul className="space-y-4">
            {locations.map((loc) => (
              <li key={loc.id} className="surface rounded-2xl p-4">
                <p className="font-semibold">{loc.name}</p>
                <p className="text-sm text-tj-muted mt-1">{loc.hours}</p>
                <p className="mt-2 text-sm">
                  <span className="badge badge-leaf">{crowdLabel(loc.typicalCrowd)}</span>
                  <span className="ml-2 text-tj-muted">Restock: {loc.restockingTimes}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">
            Latest receipts
          </h2>
          <Link href="/costs" className="text-sm font-semibold text-tj-red">
            Cost estimator →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {receipts.map((r) => (
            <Link
              key={r.id}
              href={`/receipts/${r.id}`}
              className="surface rounded-2xl p-4 transition hover:-translate-y-0.5"
            >
              <p className="text-sm text-tj-muted">
                {r.location?.name ?? "Unknown store"}
              </p>
              <p className="mt-1 text-2xl font-semibold">{money(r.total)}</p>
              <p className="text-sm text-tj-muted">{r.items.length} items</p>
            </Link>
          ))}
          {!receipts.length && (
            <p className="text-tj-muted">No receipts yet — import one to start estimating costs.</p>
          )}
        </div>
        {lists.length > 0 && (
          <p className="mt-6 text-sm text-tj-muted">
            Active lists: {lists.map((l) => l.name).join(" · ")} ({lists.reduce((s, l) => s + l.items.length, 0)} items)
          </p>
        )}
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
