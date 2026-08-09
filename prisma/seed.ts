import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../src/lib/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function ensureUsers() {
  const joshHash = hashPassword("Josh");
  await prisma.user.upsert({
    where: { username: "josh" },
    update: {
      displayName: "Josh",
      passwordHash: joshHash,
    },
    create: {
      username: "josh",
      displayName: "Josh",
      passwordHash: joshHash,
    },
  });
  console.log("Ensured user: josh / Josh");
}

async function main() {
  await ensureUsers();

  const count = await prisma.location.count();
  if (count > 0) {
    console.log("Already seeded");
    return;
  }

  const austin = await prisma.location.create({
    data: {
      name: "Trader Joe's — South Austin",
      address: "2808 Bee Cave Rd",
      city: "Austin",
      state: "TX",
      zip: "78746",
      hours: "Mon–Sun 8:00 AM – 9:00 PM",
      restockingTimes: "Weekday mornings before 10 AM; produce mid-week",
      typicalCrowd: "BUSY",
      crowdNotes: "Packed after 5 PM weekdays and all day Sunday.",
      notes: "Parking garage fills early on weekends.",
    },
  });

  const domain = await prisma.location.create({
    data: {
      name: "Trader Joe's — Domain",
      address: "11501 Rock Rose Ave",
      city: "Austin",
      state: "TX",
      zip: "78758",
      hours: "Mon–Sun 8:00 AM – 9:00 PM",
      restockingTimes: "Tues/Thurs mornings for frozen & snacks",
      typicalCrowd: "MODERATE",
      crowdNotes: "Quieter mid-morning on weekdays.",
    },
  });

  const products = await Promise.all(
    [
      {
        name: "Mandarin Orange Chicken",
        calories: 380,
        mealType: "DINNER" as const,
        tried: true,
        liked: true,
        rating: 5,
      },
      {
        name: "Everything but the Bagel Seasoning",
        calories: 5,
        mealType: "BREAKFAST" as const,
        tried: true,
        liked: true,
        rating: 5,
      },
      {
        name: "Cauliflower Gnocchi",
        calories: 140,
        mealType: "DINNER" as const,
        tried: true,
        liked: false,
        rating: 2,
      },
      {
        name: "Hold the Cone Mini Ice Cream Cones",
        calories: 160,
        mealType: "SNACK" as const,
        tried: true,
        liked: true,
        rating: 4,
      },
      {
        name: "Soyaki",
        calories: 70,
        mealType: "DINNER" as const,
        tried: false,
        liked: false,
        rating: null,
      },
    ].map((p) =>
      prisma.product.create({
        data: {
          ...p,
          brand: "Trader Joe's",
          status: "ACTIVE",
        },
      }),
    ),
  );

  const receipt = await prisma.receipt.create({
    data: {
      locationId: austin.id,
      purchasedAt: new Date(),
      source: "MANUAL",
      subtotal: 28.45,
      tax: 2.35,
      total: 30.8,
      rawText: "Sample seeded receipt",
      items: {
        create: [
          {
            productId: products[0].id,
            rawName: products[0].name,
            quantity: 1,
            unitPrice: 5.99,
            totalPrice: 5.99,
          },
          {
            productId: products[1].id,
            rawName: products[1].name,
            quantity: 1,
            unitPrice: 2.99,
            totalPrice: 2.99,
          },
          {
            productId: products[3].id,
            rawName: products[3].name,
            quantity: 2,
            unitPrice: 3.49,
            totalPrice: 6.98,
          },
        ],
      },
    },
  });

  await prisma.groceryList.create({
    data: {
      name: "Weekly favorites",
      locationId: domain.id,
      notes: "Auto-seeded from liked & tried products",
      items: {
        create: products
          .filter((p) => p.liked && p.tried)
          .map((p) => ({
            productId: p.id,
            quantity: 1,
            mealType: p.mealType,
          })),
      },
    },
  });

  await prisma.crowdReport.createMany({
    data: [
      {
        locationId: austin.id,
        dayOfWeek: 0,
        hour: 11,
        level: "PACKED",
        notes: "Sunday brunch rush",
      },
      {
        locationId: austin.id,
        dayOfWeek: 2,
        hour: 9,
        level: "QUIET",
        notes: "Tuesday open",
      },
      {
        locationId: domain.id,
        dayOfWeek: 3,
        hour: 10,
        level: "QUIET",
      },
    ],
  });

  console.log("Seeded locations, products, receipt", receipt.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
