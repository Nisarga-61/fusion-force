import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/store";

const usernameRe = /^[A-Za-z0-9]{3,20}$/;
const passwordRe = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username = "", email = "", password = "" } = body || {};
  if (!usernameRe.test(username)) {
    return NextResponse.json({ ok: false, error: "Invalid username" }, { status: 400 });
  }
  if (!passwordRe.test(password)) {
    return NextResponse.json({ ok: false, error: "Weak password" }, { status: 400 });
  }
  const exists = [...db.users.values()].some((u) => u.username.toLowerCase() === String(username).toLowerCase());
  if (exists) return NextResponse.json({ ok: false, error: "Username exists" }, { status: 409 });
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);
  const userId = randomUUID();
  db.users.set(userId, { userId, username, email, passwordHash });
  return NextResponse.json({ ok: true, userId, username });
}
