export type ParsedLineItem = {
  rawName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type ParsedReceipt = {
  items: ParsedLineItem[];
  subtotal: number | null;
  tax: number | null;
  total: number | null;
};

const MONEY = /\$?\s*(-?\d+\.\d{2})\b/;
const QTY_PREFIX = /^(?:(\d+(?:\.\d+)?)\s*[xX]\s+)?(.+?)\s+\$?\s*(-?\d+\.\d{2})\s*$/;
const TOTAL_KEYS = /^(sub\s*total|subtotal|tax|total|amount\s*due)\b/i;

/**
 * Heuristic parser for OCR / pasted Trader Joe's-style receipt text.
 * Handles lines like: "Organic Bananas 1.29" or "2 x Mandarin Chicken 5.99"
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedLineItem[] = [];
  let subtotal: number | null = null;
  let tax: number | null = null;
  let total: number | null = null;

  for (const line of lines) {
    const totalMatch = line.match(TOTAL_KEYS);
    if (totalMatch) {
      const money = line.match(MONEY);
      if (!money) continue;
      const value = Number(money[1]);
      const key = totalMatch[1].toLowerCase().replace(/\s+/g, "");
      if (key.includes("sub")) subtotal = value;
      else if (key.includes("tax")) tax = value;
      else total = value;
      continue;
    }

    const qtyMatch = line.match(QTY_PREFIX);
    if (!qtyMatch) continue;

    const quantity = qtyMatch[1] ? Number(qtyMatch[1]) : 1;
    const rawName = qtyMatch[2].replace(/\s+/g, " ").trim();
    const totalPrice = Number(qtyMatch[3]);
    if (!rawName || Number.isNaN(totalPrice)) continue;
    if (/trader\s*joe|thank\s*you|visa|mastercard|change|cash|card/i.test(rawName)) {
      continue;
    }

    items.push({
      rawName,
      quantity,
      unitPrice: quantity ? Number((totalPrice / quantity).toFixed(2)) : totalPrice,
      totalPrice,
    });
  }

  if (total == null && items.length) {
    total = Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
  }
  if (subtotal == null && items.length) {
    subtotal = Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
  }

  return { items, subtotal, tax, total };
}
