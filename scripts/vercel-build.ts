import { spawnSync } from "node:child_process";
import { resolveDatabaseUrl } from "../src/lib/database-url";

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "generate"]);

const databaseUrl = resolveDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npx", ["tsx", "prisma/seed.ts"]);
} else {
  console.warn(
    [
      "",
      "⚠ No Postgres URL in the build environment — skipping migrate/seed.",
      "  Add DATABASE_URL (or POSTGRES_URL) in Vercel → Settings → Environment Variables",
      "  for Production/Preview with Build + Runtime enabled, then redeploy.",
      "  Until then the app will build but API/pages that hit the DB will fail at runtime.",
      "",
    ].join("\n"),
  );
}

run("npx", ["next", "build"]);
