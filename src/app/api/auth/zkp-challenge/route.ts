import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { db } from "@/lib/store";

export async function POST(req: NextRequest) {
  // Single endpoint for challenge init/verify to keep MVP simple
  const body = await req.json().catch(() => ({}));
  const { mode = "init", userId = "", question = "", correctAnswer = "", misguideAnswers = [] } = body || {};
  if (mode === "init") {
    const challengeId = randomUUID();
    const correctAnswerHash = createHash("sha256").update(correctAnswer).digest("hex");
    db.zkp.set(challengeId, {
      challengeId,
      userId,
      question,
      correctAnswerHash,
      misguideAnswers,
      createdAt: Date.now(),
      expiryTime: Date.now() + 10 * 60 * 1000,
    });
    return NextResponse.json({ challengeId, status: "created" });
  }
  if (mode === "verify") {
    const { challengeId = "", answer = "" } = body || {};
    const c = db.zkp.get(challengeId);
    if (!c) return NextResponse.json({ ok: false }, { status: 404 });
    const answerHash = createHash("sha256").update(answer).digest("hex");
    const ok = answerHash === c.correctAnswerHash && Date.now() < c.expiryTime;
    return NextResponse.json({ ok });
  }
  return NextResponse.json({ error: "invalid mode" }, { status: 400 });
}
