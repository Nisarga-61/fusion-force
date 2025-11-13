import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { cid: string } }) {
  const { cid } = params;
  return NextResponse.redirect(`https://ipfs.io/ipfs/${cid}`);
}
