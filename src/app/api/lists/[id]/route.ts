import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const list = await prisma.groceryList.findUnique({
    where: { id },
    include: {
      location: true,
      items: { include: { product: true }, orderBy: { mealType: "asc" } },
    },
  });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const averages = await averagePricesByProduct();
  const estimate = list.items.reduce((s, item) => {
    const unit = averages.get(item.productId) ?? 0;
    return s + unit * item.quantity;
  }, 0);
  return NextResponse.json({ ...list, estimate: Number(estimate.toFixed(2)) });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  locationId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const list = await prisma.groceryList.update({
    where: { id },
    data: body,
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(list);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.groceryList.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
