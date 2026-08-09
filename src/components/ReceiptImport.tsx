"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Location = { id: string; name: string };

type ParsedItem = {
  rawName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

function todayInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ReceiptImport({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [purchasedAt, setPurchasedAt] = useState(todayInputValue());
  const [tax, setTax] = useState("0");
  const [source, setSource] = useState<"OCR" | "MANUAL">("MANUAL");
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseHint, setParseHint] = useState<string | null>(null);

  const subtotal = useMemo(
    () => Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)),
    [items],
  );
  const total = Number((subtotal + Number(tax || 0)).toFixed(2));

  async function runOcr(file: File) {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setError("PDF isn’t supported yet — use a photo (JPG/PNG) or paste text.");
      return;
    }
    setBusy(true);
    setOcrStatus("Loading OCR…");
    setError(null);
    setParseHint(null);
    setSource("OCR");
    try {
      const { createWorker } = await import("tesseract.js");
      setOcrStatus("Reading receipt…");
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      setRawText(text);
      setOcrStatus("OCR complete — review lines below");
      await parseText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "OCR failed");
      setOcrStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function parseText(text: string) {
    setParsing(true);
    setError(null);
    setParseHint(null);
    try {
      const res = await fetch("/api/receipts/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        items?: ParsedItem[];
        tax?: number | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Could not parse receipt text");
      }
      const nextItems = data.items ?? [];
      setItems(nextItems);
      if (data.tax != null) setTax(String(data.tax));
      if (!nextItems.length) {
        setParseHint(
          "No line items found. Check the text looks like receipt lines (name + price), then try again.",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  async function onParseClick() {
    setSource("MANUAL");
    await parseText(rawText);
  }

  function updateItem(idx: number, patch: Partial<ParsedItem>) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, ...patch };
        if (patch.quantity != null || patch.unitPrice != null) {
          next.totalPrice = Number((next.quantity * next.unitPrice).toFixed(2));
        }
        return next;
      }),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const purchasedIso = purchasedAt
        ? new Date(`${purchasedAt}T12:00:00`).toISOString()
        : undefined;
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: locationId || null,
          purchasedAt: purchasedIso,
          rawText,
          source,
          tax: Number(tax || 0),
          subtotal,
          total,
          items,
          linkProducts: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not save receipt");
      router.push(`/receipts/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 surface rounded-2xl p-5">
      {!locations.length && (
        <p className="rounded-lg bg-tj-mist/50 px-3 py-2 text-sm text-tj-ink">
          No stores yet.{" "}
          <Link href="/locations" className="font-semibold text-tj-red underline-offset-2 hover:underline">
            Add a store
          </Link>{" "}
          so receipts can be tied to a location.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Store
          <select
            className="select mt-1"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Unknown</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Purchase date
          <input
            type="date"
            className="input mt-1"
            value={purchasedAt}
            onChange={(e) => setPurchasedAt(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Photo for OCR
          <input
            type="file"
            accept="image/*"
            className="input mt-1"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void runOcr(file);
            }}
          />
        </label>
      </div>
      {ocrStatus && <p className="text-sm text-tj-leaf">{ocrStatus}</p>}

      <label className="text-sm block">
        Receipt text (paste or OCR result)
        <textarea
          className="textarea mt-1 min-h-36 font-mono text-sm"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={"Organic Bananas 1.29\n2 x Mandarin Orange Chicken 11.98\nTax 1.05\nTotal 14.32"}
        />
      </label>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={busy || parsing || !rawText.trim()}
        onClick={() => void onParseClick()}
      >
        {parsing ? "Parsing…" : "Parse text into line items"}
      </button>
      {parseHint && <p className="text-sm text-tj-muted">{parseHint}</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-tj-muted border-b border-black/10">
                <th className="py-2">Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black/5">
                  <td className="py-2 pr-2">
                    <input
                      className="input"
                      aria-label={`Item ${idx + 1} name`}
                      value={item.rawName}
                      onChange={(e) => updateItem(idx, { rawName: e.target.value })}
                    />
                  </td>
                  <td className="pr-2 w-20">
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      aria-label={`Item ${idx + 1} quantity`}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="pr-2 w-24">
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      aria-label={`Item ${idx + 1} unit price`}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(idx, { unitPrice: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="w-24">${item.totalPrice.toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="text-tj-red text-xs font-semibold"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { rawName: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
              ])
            }
          >
            Add line
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          Tax
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
          />
        </label>
        <div className="text-sm">
          <p className="text-tj-muted">Subtotal</p>
          <p className="mt-2 text-xl font-semibold">${subtotal.toFixed(2)}</p>
        </div>
        <div className="text-sm">
          <p className="text-tj-muted">Total</p>
          <p className="mt-2 text-xl font-semibold">${total.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-tj-red" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={busy || parsing || !items.length}>
        {busy ? "Saving…" : "Save receipt & link products"}
      </button>
    </form>
  );
}
