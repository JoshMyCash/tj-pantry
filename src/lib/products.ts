import { prisma } from "@/lib/db";

/** Find or create a product by case-insensitive name match. */
export async function findOrCreateProduct(rawName: string) {
  const name = rawName.replace(/\s+/g, " ").trim();
  const existing = await prisma.product.findFirst({
    where: { name: { equals: name } },
  });
  if (existing) return existing;
  // SQLite equals is case-sensitive; do a loose scan for small catalogs
  const all = await prisma.product.findMany({ select: { id: true, name: true } });
  const hit = all.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (hit) return prisma.product.findUniqueOrThrow({ where: { id: hit.id } });
  return prisma.product.create({
    data: { name, brand: "Trader Joe's" },
  });
}

export async function averagePricesByProduct() {
  const items = await prisma.receiptItem.findMany({
    where: { productId: { not: null } },
    select: { productId: true, unitPrice: true },
  });
  const map = new Map<string, { sum: number; n: number }>();
  for (const item of items) {
    if (!item.productId) continue;
    const cur = map.get(item.productId) ?? { sum: 0, n: 0 };
    cur.sum += item.unitPrice;
    cur.n += 1;
    map.set(item.productId, cur);
  }
  const avg = new Map<string, number>();
  for (const [id, { sum, n }] of map) {
    avg.set(id, Number((sum / n).toFixed(2)));
  }
  return avg;
}
