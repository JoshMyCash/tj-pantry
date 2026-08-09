import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.location.count();
  console.log(`✅ Connected. locations=${count}`);
}

main()
  .catch((error) => {
    console.error("Prisma verify failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
