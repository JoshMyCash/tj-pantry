import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  calories: z.number().int().nullable().optional(),
  servingSize: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  openFoodFactsId: z.string().nullable().optional(),
  nutritionJson: z.string().nullable().optional(),
  mealType: z
    .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"])
    .nullable()
    .optional(),
  notes: z.string().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  tried: z.boolean().optional(),
  liked: z.boolean().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "CANT_FIND"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      receiptItems: {
        include: { receipt: true },
        orderBy: { receipt: { purchasedAt: "desc" } },
        take: 20,
      },
    },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const product = await prisma.product.update({ where: { id }, data: body });
  return NextResponse.json(product);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const onLists = await prisma.groceryListItem.count({ where: { productId: id } });
    if (onLists > 0) {
      return NextResponse.json(
        {
          error: `This product is on ${onLists} list item${onLists === 1 ? "" : "s"}. Remove it from lists or archive instead.`,
        },
        { status: 409 },
      );
    }
    await prisma.receiptItem.updateMany({
      where: { productId: id },
      data: { productId: null },
    });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not delete product. Try archiving it instead." },
      { status: 409 },
    );
  }
}
