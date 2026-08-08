import { NextResponse } from "next/server";
import { searchOpenFoodFacts } from "@/lib/open-food-facts";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  const results = await searchOpenFoodFacts(q, 8);
  return NextResponse.json({ results });
}
