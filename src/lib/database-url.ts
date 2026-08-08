/**
 * Resolve a Postgres URL from the env names commonly set by
 * Prisma Postgres, Neon, and the Vercel Marketplace.
 *
 * Prefer non-pooling URLs for migrations when available.
 */
const DATABASE_URL_CANDIDATES = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_CANDIDATES) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function requireDatabaseUrl(): string {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      [
        "No Postgres connection string found.",
        "Set DATABASE_URL (or POSTGRES_URL / POSTGRES_PRISMA_URL) in the environment.",
        "On Vercel: Project Settings → Environment Variables, and enable it for Build as well as Runtime.",
      ].join(" "),
    );
  }
  // Normalize so Prisma CLI, seed, and the app all see DATABASE_URL.
  process.env.DATABASE_URL = url;
  return url;
}
