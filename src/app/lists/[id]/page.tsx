import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";
import { ListDetailClient } from "@/components/ListDetailClient";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [list, products, averages] = await Promise.all([
    prisma.groceryList.findUnique({
      where: { id },
      include: {
        location: true,
        items: { include: { product: true } },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, mealType: true, status: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    averagePricesByProduct(),
  ]);
  if (!list) notFound();

  const priceByProduct = Object.fromEntries(averages.entries());

  return (
    <div className="space-y-6 animate-rise">
      <Link href="/lists" className="text-sm font-semibold text-tj-red print:hidden">
        ← Lists
      </Link>
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">{list.name}</h1>
        <p className="text-tj-muted mt-1">
          {list.location?.name ?? "Any store"}
          {list.notes ? ` · ${list.notes}` : ""}
        </p>
      </header>
      <ListDetailClient
        listId={list.id}
        listName={list.name}
        initialItems={list.items}
        products={products}
        priceByProduct={priceByProduct}
      />
    </div>
  );
}
