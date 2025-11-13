import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/store";
import { decryptTemplate } from "@/lib/crypto";

function cosine(a: number[], b: number[]) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function POST(req: NextRequest) {
  // Identify user by refresh cookie; body: { features: number[] }
  const body = await req.json().catch(() => ({}));
  const { features = [] } = body || {};
  const refresh = req.cookies.get("refresh_token")?.value;
  if (!refresh) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const { verifyToken } = await import("@/lib/jwt");
    const payload = verifyToken<{ sub: string; type: string }>(refresh);
    if (payload.type !== "refresh") return NextResponse.json({ ok: false }, { status: 401 });

    // Rate limiting and lockout
    const key = payload.sub;
    const record = db.bioAttempts.get(key) || { fails: 0 };
    const now = Date.now();
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
      return NextResponse.json({ ok: false, locked: true, retryAfter }, { status: 429 });
    }

    const user = db.users.get(payload.sub);
    if (!user?.biometric) return NextResponse.json({ ok: false }, { status: 404 });
    const dec = decryptTemplate(user.biometric.iv, user.biometric.tag, user.biometric.data);
    const saved = JSON.parse(dec.toString("utf8")) as { features: number[] };
    const score = cosine(saved.features, features);
    const ok = score >= 0.95;

    if (ok) {
      db.bioAttempts.set(key, { fails: 0 });
      const res = NextResponse.json({ ok, score });
      // Mark biometric verified for this session for 30 minutes
      res.cookies.set("bio_ok", "1", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 30 });
      return res;
    } else {
      const maxFails = 5;
      const fails = (record.fails || 0) + 1;
      const remaining = Math.max(0, maxFails - fails);
      if (fails >= maxFails) {
        const lockMs = 5 * 60 * 1000; // 5 minutes
        db.bioAttempts.set(key, { fails, lockedUntil: now + lockMs });
        return NextResponse.json({ ok: false, score, locked: true, retryAfter: Math.ceil(lockMs / 1000) }, { status: 429 });
      } else {
        db.bioAttempts.set(key, { fails });
        return NextResponse.json({ ok: false, score, remaining }, { status: 401 });
      }
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
