import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./src/lib/database-url";

// Do not use env("DATABASE_URL") here — it throws while loading the config and
// breaks `prisma generate` / Vercel postinstall when the var is unset.
// migrate/seed still require a real URL (resolved below or skipped by vercel-build).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
