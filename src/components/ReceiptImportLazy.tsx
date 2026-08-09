"use client";

import dynamic from "next/dynamic";

export const ReceiptImportLazy = dynamic(
  () =>
    import("@/components/ReceiptImport").then((mod) => mod.ReceiptImport),
  {
    ssr: false,
    loading: () => (
      <div className="surface rounded-2xl p-5 text-sm text-tj-muted">
        Preparing receipt importer…
      </div>
    ),
  },
);
