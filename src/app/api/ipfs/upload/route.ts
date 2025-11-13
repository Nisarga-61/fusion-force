import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Optional: proxy to Pinata if env present; otherwise return stub CID
  const jwt = process.env.PINATA_JWT;
  if (!jwt) {
    return NextResponse.json({ cid: "bafybeigdyrstubcid" });
  }
  const formData = await req.formData();
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData as any,
  });
  const data = await res.json();
  return NextResponse.json({ cid: data?.IpfsHash || "" });
}
