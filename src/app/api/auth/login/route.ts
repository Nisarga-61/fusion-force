import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email = "", password = "" } = body || {};
  const hash = createHash("sha256").update(password).digest("hex");
  const user = [...db.users.values()].find((u) => u.email === email && u.passwordHash === hash);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, userId: user.userId });
}
