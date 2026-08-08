import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      location: true,
      items: { include: { product: true } },
    },
  });
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(receipt);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.receipt.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
