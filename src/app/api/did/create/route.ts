import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST() {
  const id = randomUUID();
  // Stub DID; later wire to on-chain DID registry
  const did = `did:example:${id}`;
  return NextResponse.json({ did });
}
