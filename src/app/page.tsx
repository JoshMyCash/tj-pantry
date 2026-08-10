import Link from "next/link";
import { prisma } from "@/lib/db";
import { money, crowdLabel, fmtDate } from "@/lib/format";
import { averagePricesByProduct } from "@/lib/products";
import { DatabaseSetup } from "@/components/DatabaseSetup";
import { isDatabaseConfigured } from "@/lib/database-url";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isDatabaseConfigured()) {
    return <DatabaseSetup />;
  }

  try {
    const [productCount, liked, receipts, locations, lists, averages] =
      await Promise.all([
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.product.findMany({
          where: { liked: true, tried: true, status: "ACTIVE" },
          take: 6,
          orderBy: { rating: "desc" },
        }),
        prisma.receipt.findMany({
          take: 3,
          orderBy: { purchasedAt: "desc" },
          select: {
            id: true,
            total: true,
            purchasedAt: true,
            location: { select: { name: true } },
            _count: { select: { items: true } },
          },
        }),
        prisma.location.findMany({ take: 3, orderBy: { name: "asc" } }),
        prisma.groceryList.findMany({
          take: 3,
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            name: true,
            updatedAt: true,
            items: { select: { checked: true } },
          },
        }),
        averagePricesByProduct(),
      ]);

    const favoritesEstimate = liked.reduce(
      (s, p) => s + (averages.get(p.id) ?? 0),
      0,
    );
    const lastThreeSpend = receipts.reduce((s, r) => s + r.total, 0);
    const continueList = lists[0] ?? null;
    const unchecked = continueList
      ? continueList.items.filter((i) => !i.checked).length
      : 0;

    return (
      <div className="space-y-12">
        <section className="relative overflow-hidden rounded-none min-h-[28vh] sm:min-h-[34vh] flex flex-col justify-end pb-7 pt-10">
          <div
            className="pointer-events-none absolute inset-0 -mx-4 bg-[radial-gradient(ellipse_at_70%_20%,rgba(200,16,46,0.18),transparent_55%),linear-gradient(135deg,#1c2430_0%,#2f6b4f_55%,#c8102e_120%)]"
            aria-hidden
          />
          <div className="relative z-10 max-w-2xl text-white px-1 animate-rise">
            <p className="brand-mark font-[family-name:var(--font-display)] text-4xl sm:text-5xl leading-[0.95] tracking-tight">
              TJ Pantry
            </p>
            <h1 className="mt-3 text-base sm:text-lg font-medium text-white/90 max-w-lg animate-rise-delay">
              Pick up where you left off — lists, receipts, and ratings.
            </h1>
            <div className="mt-5 flex flex-wrap gap-3 animate-rise-delay-2">
              {continueList ? (
                <Link href={`/lists/${continueList.id}`} className="btn btn-primary">
                  Continue “{continueList.name}”
                  {unchecked ? ` (${unchecked} left)` : ""}
                </Link>
              ) : (
                <Link href="/lists" className="btn btn-primary">
                  Make a list
                </Link>
              )}
              <Link
                href="/receipts"
                className="btn bg-white/10 text-white border border-white/30 hover:bg-white/20"
              >
                Import a receipt
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3 animate-rise">
          <Stat label="Active products" value={String(productCount)} />
          <Stat label="Last 3 trips" value={money(lastThreeSpend)} />
          <Stat label="Favorites run estimate" value={money(favoritesEstimate)} />
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-tj-ink">
                Active lists
              </h2>
              <Link href="/lists" className="text-sm font-semibold text-tj-red">
                All lists →
              </Link>
            </div>
            {lists.length ? (
              <ul className="space-y-3">
                {lists.map((list) => {
                  const left = list.items.filter((i) => !i.checked).length;
                  return (
                    <li key={list.id}>
                      <Link
                        href={`/lists/${list.id}`}
                        className="surface flex items-center justify-between rounded-2xl p-4 transition hover:-translate-y-0.5"
                      >
                        <div>
                          <p className="font-semibold">{list.name}</p>
                          <p className="text-sm text-tj-muted">
                            {left} unchecked · {list.items.length} total
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-tj-red">Open →</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="No lists yet"
                body="Build a weekly run from liked & tried products."
                actionHref="/lists"
                actionLabel="Create a list"
              />
            )}
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-tj-ink">
                Liked & tried
              </h2>
              <Link href="/products?liked=1&tried=1" className="text-sm font-semibold text-tj-red">
                Browse →
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
                <EmptyState
                  title="No favorites yet"
                  body="Mark products tried & liked to fill this list."
                  actionHref="/products"
                  actionLabel="Browse products"
                />
              )}
            </ul>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-3xl">
                Latest receipts
              </h2>
              <Link href="/receipts" className="text-sm font-semibold text-tj-red">
                Import →
              </Link>
            </div>
            <div className="grid gap-3">
              {receipts.map((r) => (
                <Link
                  key={r.id}
                  href={`/receipts/${r.id}`}
                  className="surface rounded-2xl p-4 transition hover:-translate-y-0.5"
                >
                  <p className="text-sm text-tj-muted">
                    {fmtDate(r.purchasedAt)} · {r.location?.name ?? "Unknown store"}
                  </p>
                  <p className="mt-1 text-2xl font-semibold">{money(r.total)}</p>
                  <p className="text-sm text-tj-muted">{r._count.items} items</p>
                </Link>
              ))}
              {!receipts.length && (
                <EmptyState
                  title="No receipts yet"
                  body="Import one to start estimating costs from real prices."
                  actionHref="/receipts"
                  actionLabel="Import a receipt"
                />
              )}
            </div>
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
              {!locations.length && (
                <EmptyState
                  title="No stores yet"
                  body="Add your usual Trader Joe’s for hours and crowd notes."
                  actionHref="/locations"
                  actionLabel="Add a store"
                />
              )}
            </ul>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return <DatabaseSetup detail={detail} />;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-tj-red pl-4">
      <p className="text-sm text-tj-muted">{label}</p>
      <p className="font-[family-name:var(--font-display)] text-3xl mt-1">{value}</p>
    </div>
  );
}
