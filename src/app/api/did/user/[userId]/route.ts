import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { userId: string } }) {
  // Stub: return a fabricated DID
  return NextResponse.json({ userId: params.userId, did: `did:example:${params.userId}` });
}
