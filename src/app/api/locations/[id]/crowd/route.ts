import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  level: z.enum(["QUIET", "MODERATE", "BUSY", "PACKED"]),
  notes: z.string().optional(),
  observedAt: z.string().datetime().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  hour: z.number().int().min(0).max(23).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = schema.parse(await req.json());
  const when = body.observedAt ? new Date(body.observedAt) : new Date();
  const report = await prisma.crowdReport.create({
    data: {
      locationId: id,
      level: body.level,
      notes: body.notes ?? "",
      observedAt: when,
      dayOfWeek: body.dayOfWeek ?? when.getDay(),
      hour: body.hour ?? when.getHours(),
    },
  });
  await prisma.location.update({
    where: { id },
    data: { typicalCrowd: body.level },
  });
  return NextResponse.json(report, { status: 201 });
}
