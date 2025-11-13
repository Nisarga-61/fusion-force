import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST() {
  return NextResponse.json({ requestId: randomUUID(), status: "requested" });
}
