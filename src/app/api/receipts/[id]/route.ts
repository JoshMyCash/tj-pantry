import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidateAveragePrices } from "@/lib/revalidate-averages";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    select: {
      id: true,
      locationId: true,
      purchasedAt: true,
      rawText: true,
      subtotal: true,
      tax: true,
      total: true,
      source: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      location: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          rawName: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          productId: true,
          product: { select: { id: true, name: true, status: true } },
        },
      },
    },
  });
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(receipt);
}

const patchSchema = z.object({
  locationId: z.string().nullable().optional(),
  purchasedAt: z.string().datetime().optional(),
  tax: z.number().nonnegative().optional(),
  subtotal: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const receipt = await prisma.receipt.update({
    where: { id },
    data: {
      ...(body.locationId !== undefined ? { locationId: body.locationId } : {}),
      ...(body.purchasedAt ? { purchasedAt: new Date(body.purchasedAt) } : {}),
      ...(body.tax !== undefined ? { tax: body.tax } : {}),
      ...(body.subtotal !== undefined ? { subtotal: body.subtotal } : {}),
      ...(body.total !== undefined ? { total: body.total } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(receipt);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.receipt.delete({ where: { id } });
  revalidateAveragePrices();
  return NextResponse.json({ ok: true });
}
