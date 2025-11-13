import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({ claims: [] }));
  return NextResponse.json({ received: body?.claims || [], status: "presented" });
}
