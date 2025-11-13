"use client";
import Link from "next/link";
import WalletConnector from "@/components/WalletConnector";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Authenticate</h1>
        <WalletConnector />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/zkp" className="rounded-md border p-4 hover:bg-zinc-50">
          <div className="font-medium">ZKP Challenge</div>
          <p className="text-sm text-zinc-600">Prove identity via challenge-response.</p>
        </Link>
        <Link href="/biometric" className="rounded-md border p-4 hover:bg-zinc-50">
          <div className="font-medium">Biometric (optional)</div>
          <p className="text-sm text-zinc-600">Use device biometric as fallback.</p>
        </Link>
      </div>
    </div>
  );
}
