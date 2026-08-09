import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { ReceiptDetailClient } from "@/components/ReceiptDetailClient";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [receipt, locations, products] = await Promise.all([
    prisma.receipt.findUnique({
      where: { id },
      include: {
        location: true,
        items: { include: { product: true } },
      },
    }),
    prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);
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
      <ReceiptDetailClient
        receipt={{
          ...receipt,
          purchasedAt: receipt.purchasedAt.toISOString(),
        }}
        locations={locations}
        products={products}
      />
    </div>
  );
}
