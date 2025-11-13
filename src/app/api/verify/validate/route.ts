import { NextResponse } from "next/server";

export async function POST() {
  // Always return valid for MVP
  return NextResponse.json({ valid: true });
}
