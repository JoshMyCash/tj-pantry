import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enrichFromOpenFoodFacts } from "@/lib/open-food-facts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hit = await enrichFromOpenFoodFacts(product.name);
  if (!hit) {
    return NextResponse.json(
      { error: "No Open Food Facts match", product },
      { status: 404 },
    );
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      openFoodFactsId: hit.openFoodFactsId,
      imageUrl: product.imageUrl || hit.imageUrl || null,
      calories: product.calories ?? hit.calories ?? null,
      servingSize: product.servingSize || hit.servingSize || null,
      nutritionJson: hit.nutritionJson ?? product.nutritionJson,
      brand: product.brand || hit.brand || "Trader Joe's",
    },
  });

  return NextResponse.json({ product: updated, match: hit });
}
