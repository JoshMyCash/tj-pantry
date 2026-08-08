import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export async function GET() {
  const locations = await prisma.location.findMany({
    include: {
      crowdReports: { orderBy: { observedAt: "desc" }, take: 8 },
      _count: { select: { receipts: true, groceryLists: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(locations);
}

const schema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  hours: z.string().default(""),
  restockingTimes: z.string().default(""),
  typicalCrowd: z.enum(["QUIET", "MODERATE", "BUSY", "PACKED"]).optional(),
  crowdNotes: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const location = await prisma.location.create({
    data: {
      ...body,
      typicalCrowd: body.typicalCrowd ?? "MODERATE",
      crowdNotes: body.crowdNotes ?? "",
      notes: body.notes ?? "",
    },
  });
  return NextResponse.json(location, { status: 201 });
}
