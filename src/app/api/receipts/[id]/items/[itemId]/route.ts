import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidateAveragePrices } from "@/lib/revalidate-averages";

const patchSchema = z.object({
  productId: z.string().nullable().optional(),
  rawName: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const body = patchSchema.parse(await req.json());

  const existing = await prisma.receiptItem.findFirst({
    where: { id: itemId, receiptId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.receiptItem.update({
    where: { id: itemId },
    data: body,
    include: { product: true },
  });
  revalidateAveragePrices();
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params;
  const existing = await prisma.receiptItem.findFirst({
    where: { id: itemId, receiptId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.receiptItem.delete({ where: { id: itemId } });
  revalidateAveragePrices();
  return NextResponse.json({ ok: true });
}
