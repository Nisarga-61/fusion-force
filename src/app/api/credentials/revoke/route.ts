import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { credentialId = "" } = body || {};
  if (!credentialId) return NextResponse.json({ ok: false, error: "credentialId required" }, { status: 400 });
  // Stub: mark as revoked in response only
  return NextResponse.json({ credentialId, status: "revoked" });
}
