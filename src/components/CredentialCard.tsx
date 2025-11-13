import React from "react";

type Props = {
  title: string;
  issuer: string;
  issueDate: string;
  status?: "valid" | "revoked" | "pending";
};

export function CredentialCard({ title, issuer, issueDate, status = "valid" }: Props) {
  const badge =
    status === "valid" ? "✅ Valid" : status === "revoked" ? "❌ Revoked" : "⏳ Pending";
  return (
    <div className="rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-sm">{badge}</span>
      </div>
      <p className="text-sm text-zinc-600">Issuer: {issuer}</p>
      <p className="text-sm text-zinc-600">Issued: {issueDate}</p>
    </div>
  );
}
