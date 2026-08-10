import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseReceiptText } from "@/lib/receipt-parse";
import { findOrCreateProduct } from "@/lib/products";
import { revalidateAveragePrices } from "@/lib/revalidate-averages";

export async function GET() {
  const receipts = await prisma.receipt.findMany({
    select: {
      id: true,
      purchasedAt: true,
      subtotal: true,
      tax: true,
      total: true,
      source: true,
      notes: true,
      locationId: true,
      location: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          rawName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          productId: true,
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
    take: 50,
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
  // Accepted for API compat but never persisted (free-plan storage).
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
  const createdItems = await Promise.all(
    items.map(async (item) => {
      let productId = item.productId ?? null;
      if (link && !productId) {
        const product = await findOrCreateProduct(item.rawName);
        productId = product.id;
      }
      return {
        rawName: item.rawName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productId,
      };
    }),
  );

  const receipt = await prisma.receipt.create({
    data: {
      locationId: body.locationId ?? null,
      purchasedAt: body.purchasedAt ? new Date(body.purchasedAt) : new Date(),
      rawText: body.rawText ?? "",
      // Never store base64 OCR images — OCR is client-side only.
      imageData: null,
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

  revalidateAveragePrices();
  return NextResponse.json(receipt, { status: 201 });
}
