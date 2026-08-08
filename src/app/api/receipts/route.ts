import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseReceiptText } from "@/lib/receipt-parse";
import { findOrCreateProduct } from "@/lib/products";

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    include: {
      location: true,
      items: { include: { product: true } },
    },
    orderBy: { purchasedAt: "desc" },
  });
  return NextResponse.json(receipts);
}

const itemSchema = z.object({
  rawName: z.string().min(1),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().nonnegative().default(0),
  totalPrice: z.number().nonnegative().default(0),
  productId: z.string().optional().nullable(),
});

const createSchema = z.object({
  locationId: z.string().nullable().optional(),
  purchasedAt: z.string().datetime().optional(),
  rawText: z.string().optional(),
  imageData: z.string().nullable().optional(),
  source: z.enum(["OCR", "MANUAL"]).default("MANUAL"),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).optional(),
  parseFromText: z.boolean().optional(),
  linkProducts: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = createSchema.parse(await req.json());
  let items = body.items ?? [];
  let subtotal = body.subtotal;
  let tax = body.tax ?? 0;
  let total = body.total;

  if (body.parseFromText && body.rawText) {
    const parsed = parseReceiptText(body.rawText);
    if (!items.length) items = parsed.items;
    subtotal ??= parsed.subtotal ?? undefined;
    tax = body.tax ?? parsed.tax ?? 0;
    total ??= parsed.total ?? undefined;
  }

  if (subtotal == null) {
    subtotal = Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
  }
  if (total == null) {
    total = Number((subtotal + tax).toFixed(2));
  }

  const link = body.linkProducts !== false;
  const createdItems = [];
  for (const item of items) {
    let productId = item.productId ?? null;
    if (link && !productId) {
      const product = await findOrCreateProduct(item.rawName);
      productId = product.id;
    }
    createdItems.push({
      rawName: item.rawName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      productId,
    });
  }

  const receipt = await prisma.receipt.create({
    data: {
      locationId: body.locationId ?? null,
      purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
      rawText: body.rawText ?? "",
      imageData: body.imageData ?? null,
      source: body.source,
      subtotal,
      tax,
      total,
      notes: body.notes ?? "",
      items: { create: createdItems },
    },
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(receipt, { status: 201 });
}
