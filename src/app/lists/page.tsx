import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";
import { ListsClient } from "@/components/ListsClient";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const [lists, locations] = await Promise.all([
    prisma.groceryList.findMany({
      include: {
        location: true,
        items: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);
  const averages = await averagePricesByProduct();
  const withEstimate = lists.map((list) => ({
    ...list,
    estimate: Number(
      list.items
        .reduce((s, item) => s + (averages.get(item.productId) ?? 0) * item.quantity, 0)
        .toFixed(2),
    ),
  }));

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
          TJ Pantry
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl mt-2">
          Grocery lists
        </h1>
        <p className="mt-2 text-tj-muted max-w-xl">
          Build a regular run from liked & tried products, assign breakfast / lunch / dinner, and see a receipt-based cost estimate.
        </p>
      </header>
      <ListsClient lists={withEstimate} locations={locations} />
    </div>
  );
}
