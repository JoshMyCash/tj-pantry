import Link from "next/link";
import { prisma } from "@/lib/db";
import { money, fmtDate } from "@/lib/format";
import { ReceiptImport } from "@/components/ReceiptImport";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const [receipts, locations] = await Promise.all([
    prisma.receipt.findMany({
      include: { location: true, items: true },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
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

      <ReceiptImport locations={locations} />

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
                    {r.items.length} items
                  </p>
                </div>
                <p className="text-lg font-semibold">{money(r.total)}</p>
              </Link>
            </li>
          ))}
          {!receipts.length && (
            <li className="py-6 text-tj-muted">No receipts imported yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
