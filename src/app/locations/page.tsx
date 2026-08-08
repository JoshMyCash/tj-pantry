import { prisma } from "@/lib/db";
import { LocationsClient } from "@/components/LocationsClient";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    include: {
      crowdReports: { orderBy: { observedAt: "desc" }, take: 8 },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="animate-rise">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-tj-red">
          TJ Pantry
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl mt-2">
          Stores
        </h1>
        <p className="mt-2 text-tj-muted max-w-xl">
          Track hours, restocking windows, and how crowded each Trader Joe’s feels when you visit.
        </p>
      </header>
      <LocationsClient locations={locations} />
    </div>
  );
}
