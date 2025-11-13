import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { encryptTemplate } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  // Identify user by refresh cookie; body: { features: number[] }
  const body = await req.json().catch(() => ({}));
  const { features = [] } = body || {};
  if (!Array.isArray(features) || features.length === 0) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }
  const refresh = req.cookies.get("refresh_token")?.value;
  if (!refresh) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { verifyToken } = await import("@/lib/jwt");
    const payload = verifyToken<{ sub: string; type: string }>(refresh);
    if (payload.type !== "refresh") return NextResponse.json({ ok: false }, { status: 401 });
    const user = db.users.get(payload.sub);
    if (!user) return NextResponse.json({ ok: false }, { status: 404 });
    const buf = Buffer.from(JSON.stringify({ features }));
    const enc = encryptTemplate(buf);
    user.biometric = enc;
    db.users.set(payload.sub, user);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
