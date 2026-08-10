import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveMigrateDatabaseUrl } from "./src/lib/database-url";

// Soft resolve so `prisma generate` works when DATABASE_URL is absent (e.g. Vercel postinstall).
// Migrations use the direct/unpooled URL when available.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveMigrateDatabaseUrl(),
  },
});
