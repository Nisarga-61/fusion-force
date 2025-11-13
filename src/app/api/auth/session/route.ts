import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/store";
import { signAccess, signRefresh, verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username = "", password = "" } = body || {};
  const user = [...db.users.values()].find((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  const access = signAccess({ sub: user.userId, username: user.username });
  const refresh = signRefresh({ sub: user.userId, type: "refresh" });
  const res = NextResponse.json({ ok: true, access });
  res.cookies.set("refresh_token", refresh, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}

export async function PUT(req: NextRequest) {
  const cookies = req.cookies.get("refresh_token")?.value;
  if (!cookies) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const payload = verifyToken<{ sub: string; type: string }>(cookies);
    if (payload.type !== "refresh") return NextResponse.json({ ok: false }, { status: 401 });
    const user = db.users.get(payload.sub);
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const access = signAccess({ sub: user.userId, username: user.username });
    const res = NextResponse.json({ ok: true, access });
    // Optionally rotate refresh here
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
