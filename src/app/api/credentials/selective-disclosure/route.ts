import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Echo requested fields back with a stub proof
  return NextResponse.json({ proof: { type: "stub", disclosed: body?.fields || [] } });
}
