import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { AVERAGE_PRICES_TAG } from "@/lib/cache-tags";

/** Find or create a product by case-insensitive name match. */
export async function findOrCreateProduct(rawName: string) {
  const name = rawName.replace(/\s+/g, " ").trim();
  if (!name) {
    throw new Error("Product name is required");
  }

  const existing = await prisma.product.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.product.create({
    data: { name, brand: "Trader Joe's" },
  });
}

type AveragePriceEntry = [string, number];

/**
 * SQL aggregate of average unit price per product.
 * Cached across requests — this ran on nearly every page and burned free-tier ops.
 */
const loadAveragePriceEntries = unstable_cache(
  async (): Promise<AveragePriceEntry[]> => {
    const rows = await prisma.receiptItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _avg: { unitPrice: true },
    });

    const entries: AveragePriceEntry[] = [];
    for (const row of rows) {
      if (!row.productId || row._avg.unitPrice == null) continue;
      entries.push([row.productId, Number(row._avg.unitPrice.toFixed(2))]);
    }
    return entries;
  },
  ["average-prices-by-product"],
  {
    // Stale-while-revalidate window; writes also invalidate via revalidateTag.
    revalidate: 60 * 60,
    tags: [AVERAGE_PRICES_TAG],
  },
);

/** Average unit price per product from receipt history (cached). */
export async function averagePricesByProduct() {
  const entries = await loadAveragePriceEntries();
  return new Map(entries);
}
