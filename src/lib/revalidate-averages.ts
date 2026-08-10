import { revalidateTag } from "next/cache";
import { AVERAGE_PRICES_TAG } from "@/lib/cache-tags";

/** Invalidate cached receipt averages after price-affecting writes. */
export function revalidateAveragePrices() {
  revalidateTag(AVERAGE_PRICES_TAG, "max");
}
