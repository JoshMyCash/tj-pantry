import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    orderBy: { purchasedAt: "desc" },
    include: { items: true, location: true },
  });

  const totalSpent = receipts.reduce((s, r) => s + r.total, 0);
  const avgTrip =
    receipts.length > 0
      ? Number((totalSpent / receipts.length).toFixed(2))
      : 0;

  const averages = await averagePricesByProduct();
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", liked: true, tried: true },
  });

  const regularListEstimate = products.reduce((s, p) => {
    return s + (averages.get(p.id) ?? 0);
  }, 0);

  const byMonth = new Map<string, number>();
  for (const r of receipts) {
    const key = r.purchasedAt.toISOString().slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.total);
  }

  return NextResponse.json({
    receiptCount: receipts.length,
    totalSpent: Number(totalSpent.toFixed(2)),
    avgTrip,
    regularListEstimate: Number(regularListEstimate.toFixed(2)),
    likedProductCount: products.length,
    byMonth: [...byMonth.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) })),
    recent: receipts.slice(0, 5).map((r) => ({
      id: r.id,
      purchasedAt: r.purchasedAt,
      total: r.total,
      location: r.location?.name ?? null,
      itemCount: r.items.length,
    })),
  });
}
