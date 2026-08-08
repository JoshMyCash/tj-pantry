import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zip: z.string().min(1).optional(),
  hours: z.string().optional(),
  restockingTimes: z.string().optional(),
  typicalCrowd: z.enum(["QUIET", "MODERATE", "BUSY", "PACKED"]).optional(),
  crowdNotes: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      crowdReports: { orderBy: { observedAt: "desc" } },
      receipts: { orderBy: { purchasedAt: "desc" }, take: 10 },
    },
  });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(location);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = schema.parse(await req.json());
  const location = await prisma.location.update({ where: { id }, data: body });
  return NextResponse.json(location);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.location.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
