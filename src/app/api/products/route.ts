import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { averagePricesByProduct } from "@/lib/products";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const meal = searchParams.get("meal");
  const q = searchParams.get("q");
  const liked = searchParams.get("liked");
  const tried = searchParams.get("tried");

  const products = await prisma.product.findMany({
    where: {
      ...(status ? { status: status as "ACTIVE" | "ARCHIVED" | "CANT_FIND" } : {}),
      ...(meal ? { mealType: meal as "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER" } : {}),
      ...(liked === "1" ? { liked: true } : {}),
      ...(tried === "1" ? { tried: true } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { brand: { contains: q } },
              { notes: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ liked: "desc" }, { rating: "desc" }, { name: "asc" }],
  });

  const averages = await averagePricesByProduct();
  return NextResponse.json(
    products.map((p) => ({
      ...p,
      avgPrice: averages.get(p.id) ?? null,
    })),
  );
}

const createSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  calories: z.number().int().nullable().optional(),
  servingSize: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
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

export async function POST(req: Request) {
  const body = createSchema.parse(await req.json());
  const product = await prisma.product.create({
    data: {
      name: body.name,
      brand: body.brand ?? "Trader Joe's",
      calories: body.calories ?? null,
      servingSize: body.servingSize ?? null,
      imageUrl: body.imageUrl ?? null,
      mealType: body.mealType ?? null,
      notes: body.notes ?? "",
      rating: body.rating ?? null,
      tried: body.tried ?? false,
      liked: body.liked ?? false,
      status: body.status ?? "ACTIVE",
    },
  });
  return NextResponse.json(product, { status: 201 });
}
