import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { did: string } }) {
  // Stub DID Document
  return NextResponse.json({ id: `did:example:${params.did}`, publicKey: [], service: [] });
}

export async function PUT(req: NextRequest, { params }: { params: { did: string } }) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ updated: true, did: `did:example:${params.did}`, ...body });
}
