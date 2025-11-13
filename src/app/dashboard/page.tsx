"use client";
import Link from "next/link";
import { CredentialCard } from "@/components/CredentialCard";
import WalletConnector from "@/components/WalletConnector";
import { useAppStore } from "@/store/useAppStore";

export default function Page() {
  const creds = useAppStore((s) => s.credentials);
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wallet Dashboard</h1>
        <WalletConnector />
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/did/create" className="rounded-md bg-black px-3 py-2 text-white">Create DID</Link>
        <Link href="/credentials/issue" className="rounded-md border px-3 py-2">Issue Credential</Link>
        <Link href="/verify" className="rounded-md border px-3 py-2">Verification</Link>
        <Link href="/settings" className="rounded-md border px-3 py-2">Settings</Link>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Stored Credentials</h2>
        {creds.length === 0 ? (
          <p className="text-sm text-zinc-600">No credentials yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {creds.map((c) => (
              <CredentialCard key={c.id} title={c.type} issuer={c.issuer} issueDate={c.issueDate} status={c.status} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
