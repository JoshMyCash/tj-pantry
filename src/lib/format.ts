import { format } from "date-fns";
import type {
  CrowdLevel,
  MealType,
  ProductStatus,
} from "../../generated/prisma/client";

export function money(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n ?? 0);
}

export function fmtDate(d: Date | string) {
  return format(typeof d === "string" ? new Date(d) : d, "MMM d, yyyy");
}

export function mealLabel(m: MealType | null | undefined) {
  if (!m) return "Unassigned";
  return m.charAt(0) + m.slice(1).toLowerCase();
}

export function statusLabel(s: ProductStatus) {
  switch (s) {
    case "ARCHIVED":
      return "Archived";
    case "CANT_FIND":
      return "Can't find";
    default:
      return "Active";
  }
}

export function crowdLabel(c: CrowdLevel) {
  switch (c) {
    case "QUIET":
      return "Quiet";
    case "MODERATE":
      return "Moderate";
    case "BUSY":
      return "Busy";
    case "PACKED":
      return "Packed";
  }
}

export function stars(rating: number | null | undefined) {
  if (!rating) return "—";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}
