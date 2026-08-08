import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { money, fmtDate } from "@/lib/format";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      receiptItems: {
        include: { receipt: true },
        orderBy: { receipt: { purchasedAt: "desc" } },
        take: 12,
      },
    },
  });
  if (!product) notFound();

  return (
    <div className="space-y-8 animate-rise">
      <Link href="/products" className="text-sm font-semibold text-tj-red">
        ← Products
      </Link>
      <ProductDetailClient product={product} />
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl mb-3">
          Purchase history
        </h2>
        <ul className="divide-y divide-black/8">
          {product.receiptItems.map((item) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <Link href={`/receipts/${item.receiptId}`} className="hover:text-tj-red">
                {fmtDate(item.receipt.purchasedAt)}
              </Link>
              <span>
                {item.quantity} × {money(item.unitPrice)}
              </span>
            </li>
          ))}
          {!product.receiptItems.length && (
            <li className="text-tj-muted py-2">Not on any imported receipts yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
