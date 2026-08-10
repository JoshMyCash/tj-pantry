export type OffProduct = {
  code: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  nutriments?: {
    "energy-kcal_serving"?: number;
    "energy-kcal_100g"?: number;
    "energy-kcal"?: number;
  };
  serving_size?: string;
};

export type Enrichment = {
  openFoodFactsId: string;
  name?: string;
  brand?: string;
  imageUrl?: string | null;
  calories?: number | null;
  servingSize?: string | null;
  nutritionJson?: string | null;
};

function pickCalories(p: OffProduct): number | null {
  const n = p.nutriments;
  if (!n) return null;
  const raw =
    n["energy-kcal_serving"] ?? n["energy-kcal_100g"] ?? n["energy-kcal"] ?? null;
  if (raw == null || Number.isNaN(Number(raw))) return null;
  return Math.round(Number(raw));
}

export async function searchOpenFoodFacts(
  query: string,
  limit = 5,
): Promise<Enrichment[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set(
    "fields",
    "code,product_name,brands,image_url,image_front_url,nutriments,serving_size",
  );

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "TJTracker/1.0 (personal grocery app)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { products?: OffProduct[] };
  return (data.products ?? []).map((p) => ({
    openFoodFactsId: p.code,
    name: p.product_name,
    brand: p.brands,
    imageUrl: p.image_front_url ?? p.image_url ?? null,
    calories: pickCalories(p),
    servingSize: p.serving_size ?? null,
    // Store only calorie keys — full nutriments blobs burn free DB storage.
    nutritionJson: p.nutriments
      ? JSON.stringify({
          "energy-kcal_serving": p.nutriments["energy-kcal_serving"],
          "energy-kcal_100g": p.nutriments["energy-kcal_100g"],
          "energy-kcal": p.nutriments["energy-kcal"],
        })
      : null,
  }));
}

export async function enrichFromOpenFoodFacts(
  productName: string,
): Promise<Enrichment | null> {
  const q = productName.toLowerCase().includes("trader")
    ? productName
    : `Trader Joe's ${productName}`;
  const results = await searchOpenFoodFacts(q, 3);
  if (!results.length) {
    const fallback = await searchOpenFoodFacts(productName, 3);
    return fallback[0] ?? null;
  }
  return results[0] ?? null;
}
