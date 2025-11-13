import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { db } from "@/lib/store";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email = "", password = "" } = body || {};
  if (!email || !password) return NextResponse.json({ ok: false, error: "email and password required" }, { status: 400 });
  const userId = randomUUID();
  const passwordHash = createHash("sha256").update(password).digest("hex");
  db.users.set(userId, { userId, email, passwordHash });
  return NextResponse.json({ userId, email });
}
