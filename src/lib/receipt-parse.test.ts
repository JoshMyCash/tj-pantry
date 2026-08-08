import { parseReceiptText } from "./receipt-parse";

const sample = `
TRADER JOE'S
Organic Bananas 1.29
2 x Mandarin Orange Chicken 11.98
Everything Bagel Seasoning 2.99
Subtotal 16.26
Tax 1.34
Total 17.60
Thank you!
`;

const parsed = parseReceiptText(sample);
if (parsed.items.length < 3) {
  console.error("Expected >= 3 items", parsed);
  process.exit(1);
}
if (parsed.total !== 17.6) {
  console.error("Expected total 17.60", parsed);
  process.exit(1);
}
console.log("receipt-parse ok", parsed.items.length, "items");
