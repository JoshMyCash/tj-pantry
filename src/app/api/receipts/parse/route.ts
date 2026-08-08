import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceiptText } from "@/lib/receipt-parse";

const schema = z.object({ text: z.string().min(1) });

export async function POST(req: Request) {
  const { text } = schema.parse(await req.json());
  return NextResponse.json(parseReceiptText(text));
}
