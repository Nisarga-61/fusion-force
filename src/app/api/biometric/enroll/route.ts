import { NextResponse } from "next/server";

export async function POST() {
  // Placeholder: would enroll via WebAuthn or device APIs
  return NextResponse.json({ enrolled: true });
}
