import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { requireDatabaseUrl } from "../src/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = requireDatabaseUrl();
  // Serverless: one connection per warm isolate. Creating a client (or a large
  // pool) per request burns Prisma Postgres free-plan connection limits.
  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    // Recycle idle connections so free-tier pool slots are not held forever.
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy so importing modules does not require DATABASE_URL until a query runs. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
