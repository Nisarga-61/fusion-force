import React from "react";

export function VerificationResult({ status, message }: { status: "valid" | "invalid" | "pending"; message?: string }) {
  const label = status === "valid" ? "✅ valid" : status === "invalid" ? "❌ invalid" : "⏳ pending";
  return (
    <div className="rounded-md border p-3 text-sm">
      <span className="font-medium">Result: {label}</span>
      {message && <p className="text-zinc-600">{message}</p>}
    </div>
  );
}
