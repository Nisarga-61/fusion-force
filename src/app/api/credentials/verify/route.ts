import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { credentialId = "" } = body || {};
  if (!credentialId) return NextResponse.json({ ok: false, error: "credentialId required" }, { status: 400 });
  // Stub: always valid if not revoked
  return NextResponse.json({ credentialId, valid: true });
}
