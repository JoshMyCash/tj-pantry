import Link from "next/link";
import { prisma } from "@/lib/db";
import { money, fmtDate } from "@/lib/format";
import { ReceiptImportLazy } from "@/components/ReceiptImportLazy";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const [receipts, locations] = await Promise.all([
    prisma.receipt.findMany({
      select: {
        id: true,
        purchasedAt: true,
        source: true,
        total: true,
        location: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { purchasedAt: "desc" },
      take: 50,
    }),
    prisma.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header className="animate-rise">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
          TJ Pantry
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl mt-2">
          Receipts
        </h1>
        <p className="mt-2 text-tj-muted max-w-xl">
          Upload a photo for OCR or paste receipt text. Line items become products you can rate and reuse on lists.
        </p>
      </header>

      <ReceiptImportLazy locations={locations} />

      <section className="animate-rise-delay">
        <h2 className="font-[family-name:var(--font-display)] text-2xl mb-3">
          History
        </h2>
        <ul className="divide-y divide-black/8">
          {receipts.map((r) => (
            <li key={r.id}>
              <Link
                href={`/receipts/${r.id}`}
                className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-tj-red"
              >
                <div>
                  <p className="font-semibold">{fmtDate(r.purchasedAt)}</p>
                  <p className="text-sm text-tj-muted">
                    {r.location?.name ?? "Unknown store"} · {r.source} ·{" "}
                    {r._count.items} items
                  </p>
                </div>
                <p className="text-lg font-semibold">{money(r.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
        {!receipts.length && (
          <EmptyState
            title="No receipts yet"
            body="Paste text or upload a photo above — line items become products you can rate."
          />
        )}
      </section>
    </div>
  );
}
