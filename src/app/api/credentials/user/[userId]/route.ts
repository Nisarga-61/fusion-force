import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { userId: string } }) {
  // Return stubbed list of credentials for the user
  return NextResponse.json({ userId: params.userId, credentials: [] });
}
