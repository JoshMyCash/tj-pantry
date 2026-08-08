import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  quantity: z.number().positive().optional(),
  checked: z.boolean().optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"])
    .nullable()
    .optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const body = schema.parse(await req.json());
  const item = await prisma.groceryListItem.update({
    where: { id: itemId },
    data: body,
    include: { product: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  await prisma.groceryListItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
