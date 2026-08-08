import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { money, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });
  if (!receipt) notFound();

  return (
    <div className="space-y-6 animate-rise max-w-2xl">
      <Link href="/receipts" className="text-sm font-semibold text-tj-red">
        ← Receipts
      </Link>
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          {fmtDate(receipt.purchasedAt)}
        </h1>
        <p className="text-tj-muted mt-1">
          {receipt.location?.name ?? "Unknown store"} · {receipt.source}
        </p>
      </header>

      <ul className="divide-y divide-black/8">
        {receipt.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 py-3">
            <div>
              {item.product ? (
                <Link href={`/products/${item.productId}`} className="font-medium hover:text-tj-red">
                  {item.product.name}
                </Link>
              ) : (
                <span className="font-medium">{item.rawName}</span>
              )}
              <p className="text-sm text-tj-muted">
                {item.quantity} × {money(item.unitPrice)}
              </p>
            </div>
            <span className="font-semibold">{money(item.totalPrice)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-black/10 pt-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-tj-muted">Subtotal</span>
          <span>{money(receipt.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tj-muted">Tax</span>
          <span>{money(receipt.tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold pt-1">
          <span>Total</span>
          <span>{money(receipt.total)}</span>
        </div>
      </div>

      {receipt.rawText && (
        <details className="surface rounded-2xl p-4">
          <summary className="cursor-pointer font-medium">Raw receipt text</summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs text-tj-muted font-mono">
            {receipt.rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
