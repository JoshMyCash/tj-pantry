import { prisma } from "@/lib/db";

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

/** Average unit price per product from receipt history (SQL aggregate). */
export async function averagePricesByProduct() {
  const rows = await prisma.receiptItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null } },
    _avg: { unitPrice: true },
  });

  const avg = new Map<string, number>();
  for (const row of rows) {
    if (!row.productId || row._avg.unitPrice == null) continue;
    avg.set(row.productId, Number(row._avg.unitPrice.toFixed(2)));
  }
  return avg;
}
