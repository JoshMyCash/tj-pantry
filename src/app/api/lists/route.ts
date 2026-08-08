import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";

export async function GET() {
  const lists = await prisma.groceryList.findMany({
    include: {
      location: true,
      items: { include: { product: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const averages = await averagePricesByProduct();
  return NextResponse.json(
    lists.map((list) => {
      const estimate = list.items.reduce((s, item) => {
        const unit = averages.get(item.productId) ?? 0;
        return s + unit * item.quantity;
      }, 0);
      return { ...list, estimate: Number(estimate.toFixed(2)) };
    }),
  );
}

const schema = z.object({
  name: z.string().min(1),
  locationId: z.string().nullable().optional(),
  notes: z.string().optional(),
  fromFavorites: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  let itemCreates: {
    productId: string;
    quantity: number;
    mealType:
      | "BREAKFAST"
      | "LUNCH"
      | "DINNER"
      | "SNACK"
      | "OTHER"
      | null;
  }[] = [];

  if (body.fromFavorites) {
    const favorites = await prisma.product.findMany({
      where: { liked: true, tried: true, status: "ACTIVE" },
    });
    itemCreates = favorites.map((p) => ({
      productId: p.id,
      quantity: 1,
      mealType: p.mealType,
    }));
  }

  const list = await prisma.groceryList.create({
    data: {
      name: body.name,
      locationId: body.locationId ?? null,
      notes: body.notes ?? "",
      items: itemCreates.length ? { create: itemCreates } : undefined,
    },
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(list, { status: 201 });
}
