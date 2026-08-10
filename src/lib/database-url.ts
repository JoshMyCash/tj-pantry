/**
 * Resolve a Postgres URL from the env names commonly set by
 * Prisma Postgres, Neon, and the Vercel Marketplace.
 *
 * Runtime prefers pooled URLs (serverless-safe).
 * Migrations prefer direct/unpooled URLs when available.
 */

const RUNTIME_DATABASE_URL_CANDIDATES = [
  "DATABASE_URL_POOLED",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
] as const;

const MIGRATE_DATABASE_URL_CANDIDATES = [
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "PRISMA_DATABASE_URL",
  "DATABASE_URL_POOLED",
] as const;

function firstEnvUrl(
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

/** Prefer Prisma Postgres / Neon pooled hostnames for app traffic. */
export function preferPooledDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (
      host.includes("pooler") ||
      host.startsWith("pooled.") ||
      host.includes(".pooled.")
    ) {
      return url;
    }

    // Prisma Postgres direct → pooled
    // db.prisma.io → pooled.db.prisma.io
    if (host === "db.prisma.io") {
      parsed.hostname = "pooled.db.prisma.io";
      return parsed.toString();
    }
    if (host.endsWith(".db.prisma.io") && !host.includes("pooled")) {
      parsed.hostname = host.replace(/\.db\.prisma\.io$/, ".pooled.db.prisma.io");
      return parsed.toString();
    }

    // Neon: ep-xxx.region.aws.neon.tech → ep-xxx-pooler.region.aws.neon.tech
    if (host.endsWith(".neon.tech") && !host.includes("-pooler")) {
      const parts = host.split(".");
      parts[0] = `${parts[0]}-pooler`;
      parsed.hostname = parts.join(".");
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

export function resolveRuntimeDatabaseUrl(): string | undefined {
  const raw = firstEnvUrl(RUNTIME_DATABASE_URL_CANDIDATES);
  return raw ? preferPooledDatabaseUrl(raw) : undefined;
}

export function resolveMigrateDatabaseUrl(): string | undefined {
  return firstEnvUrl(MIGRATE_DATABASE_URL_CANDIDATES);
}

/** @deprecated Prefer resolveRuntimeDatabaseUrl / resolveMigrateDatabaseUrl */
export function resolveDatabaseUrl(): string | undefined {
  return resolveRuntimeDatabaseUrl() ?? resolveMigrateDatabaseUrl();
}

export function requireDatabaseUrl(): string {
  const url = resolveRuntimeDatabaseUrl() ?? resolveMigrateDatabaseUrl();
  if (!url) {
    throw new Error(
      [
        "No Postgres connection string found.",
        "Set DATABASE_URL (or POSTGRES_URL / POSTGRES_PRISMA_URL) in the environment.",
        "On Vercel: Project Settings → Environment Variables, and enable it for Build as well as Runtime.",
        "For serverless, prefer a pooled URL (Prisma: pooled.db.prisma.io / Neon: *-pooler).",
      ].join(" "),
    );
  }
  // Normalize so Prisma CLI, seed, and the app all see DATABASE_URL.
  process.env.DATABASE_URL = url;
  return url;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(
    resolveRuntimeDatabaseUrl() ?? resolveMigrateDatabaseUrl(),
  );
}
