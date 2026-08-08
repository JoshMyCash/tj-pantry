import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  productId: z.string(),
  quantity: z.number().positive().optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"])
    .nullable()
    .optional(),
  notes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = schema.parse(await req.json());
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  const item = await prisma.groceryListItem.create({
    data: {
      groceryListId: id,
      productId: body.productId,
      quantity: body.quantity ?? 1,
      mealType: body.mealType ?? product?.mealType ?? null,
      notes: body.notes ?? "",
    },
    include: { product: true },
  });
  return NextResponse.json(item, { status: 201 });
}
