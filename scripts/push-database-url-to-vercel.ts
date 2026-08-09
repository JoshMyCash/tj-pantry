import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function run(cmd: string, args: string[], opts: { env?: NodeJS.ProcessEnv; input?: string } = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    env: { ...process.env, ...opts.env },
    input: opts.input,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`${cmd} ${args.join(" ")} failed: ${err}`);
  }
  return (result.stdout || "").trim();
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readDatabaseUrl() {
  if (!existsSync(".env")) throw new Error(".env missing — run prisma postgres link first");
  const match = readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m);
  if (!match) throw new Error("DATABASE_URL not found in .env");
  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!value) throw new Error("DATABASE_URL empty");
  return value;
}

const token = requireEnv("VERCEL_TOKEN");
const databaseUrl = readDatabaseUrl();
const env = { ...process.env, VERCEL_TOKEN: token, TOKEN: token };

// Link to existing Vercel project if needed
if (!existsSync(".vercel/project.json")) {
  mkdirSync(".vercel", { recursive: true });
  // Non-interactive link via project name from known deploy
  run(
    "npx",
    [
      "vercel",
      "link",
      "--yes",
      "--token",
      token,
      "--scope",
      "joshmycashs-projects",
      "--project",
      "tj-pantry",
    ],
    { env },
  );
}

const targets = ["production", "preview", "development"] as const;
for (const target of targets) {
  // Remove existing to allow update (ignore failure)
  spawnSync(
    "npx",
    ["vercel", "env", "rm", "DATABASE_URL", target, "--yes", "--token", token],
    { encoding: "utf8", env, stdio: "pipe" },
  );
  run(
    "npx",
    ["vercel", "env", "add", "DATABASE_URL", target, "--token", token],
    { env, input: `${databaseUrl}\n` },
  );
  console.log(`Set DATABASE_URL for ${target}`);
}

// Trigger production deploy from current branch/dir
const deployOut = run(
  "npx",
  ["vercel", "deploy", "--prod", "--yes", "--token", token],
  { env },
);
console.log("Deploy triggered.");
console.log(deployOut.split("\n").filter(Boolean).slice(-5).join("\n"));
