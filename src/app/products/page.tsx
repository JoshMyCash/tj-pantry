import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";
import { money, mealLabel, statusLabel, stars } from "@/lib/format";
import { ProductFilters } from "@/components/ProductFilters";
import { AddProductForm } from "@/components/AddProductForm";
import { ProductRowActions } from "@/components/ProductRowActions";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

type Search = Promise<{
  q?: string;
  status?: string;
  meal?: string;
  liked?: string;
  tried?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const hasFilters = Boolean(sp.q || sp.status || sp.meal || sp.liked || sp.tried);
  const [products, averages] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(sp.status
          ? { status: sp.status as "ACTIVE" | "ARCHIVED" | "CANT_FIND" }
          : {}),
        ...(sp.meal
          ? {
              mealType: sp.meal as
                | "BREAKFAST"
                | "LUNCH"
                | "DINNER"
                | "SNACK"
                | "OTHER",
            }
          : {}),
        ...(sp.liked === "1" ? { liked: true } : {}),
        ...(sp.tried === "1" ? { tried: true } : {}),
        ...(sp.q
          ? {
              OR: [
                { name: { contains: sp.q, mode: "insensitive" } },
                { brand: { contains: sp.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: "asc" }, { liked: "desc" }, { name: "asc" }],
    }),
    averagePricesByProduct(),
  ]);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
          TJ Pantry
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl mt-2">
          Products
        </h1>
        <p className="mt-2 text-tj-muted max-w-xl">
          Rate what you try, mark can&apos;t-finds, assign breakfast / lunch / dinner, and pull calories from Open Food Facts.
        </p>
      </header>

      <Suspense fallback={<div className="surface rounded-2xl p-4 text-sm text-tj-muted">Loading filters…</div>}>
        <ProductFilters />
      </Suspense>
      <AddProductForm />

      <ul className="divide-y divide-black/8 animate-rise-delay">
        {products.map((p) => (
          <li key={p.id} className="py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-3 py-1 -mx-2 rounded-xl transition hover:bg-white hover:shadow-sm">
              <Link
                href={`/products/${p.id}`}
                className="flex items-start gap-3 min-w-0 flex-1"
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-lg object-cover bg-white"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-lg border border-dashed border-black/10 bg-gradient-to-br from-white to-tj-mist font-[family-name:var(--font-display)] text-sm text-tj-red/70">
                    TJ
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-sm text-tj-muted">
                    {p.calories != null ? `${p.calories} cal` : "No cal data"}
                    {" · "}
                    {mealLabel(p.mealType)}
                    {" · "}
                    {statusLabel(p.status)}
                  </p>
                </div>
              </Link>
              <div className="flex flex-col items-start sm:items-end gap-2 text-sm sm:shrink-0 px-2 sm:px-0">
                <div className="flex items-center gap-4">
                  <span className="text-tj-sun">{stars(p.rating)}</span>
                  <span className="text-tj-muted">
                    {averages.has(p.id) ? money(averages.get(p.id)) : "—"}
                  </span>
                  {p.liked && <span className="badge badge-red">Liked</span>}
                  {!p.tried && <span className="badge">Untried</span>}
                </div>
                <ProductRowActions id={p.id} status={p.status} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!products.length && (
        <EmptyState
          title={hasFilters ? "No matching products" : "No products yet"}
          body={
            hasFilters
              ? "Try clearing filters or add something new from your latest receipt."
              : "Import a receipt or add a product manually to start rating finds."
          }
          actionHref={hasFilters ? "/products" : "/receipts"}
          actionLabel={hasFilters ? "Clear filters" : "Import a receipt"}
        />
      )}
    </div>
  );
}
