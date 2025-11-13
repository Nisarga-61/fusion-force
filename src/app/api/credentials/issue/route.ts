import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type = "Generic", issuer = "Unknown", holder = "did:example:holder" } = body || {};
  const credentialId = randomUUID();
  const ipfsCid = "bafybeigdyrstubcid";
  return NextResponse.json({ credentialId, type, issuer, holder, ipfsCid, status: "issued" });
}
