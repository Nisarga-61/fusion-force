"use client";
import { ConsentSelector } from "@/components/ConsentSelector";
import { VerificationResult } from "@/components/VerificationResult";
import WalletConnector from "@/components/WalletConnector";
import React from "react";
import { ethers } from "ethers";
import { getBrowserProvider } from "@/lib/web3";
import { CredentialRegistryAbi } from "@/lib/abis";
import { CREDENTIAL_REGISTRY_ADDRESS } from "@/lib/addresses";

export default function Page() {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<"valid" | "invalid" | "pending">("pending");
  const [credentialId, setCredentialId] = React.useState<string>("");

  const request = async () => {
    await fetch("/api/verify/request", { method: "POST", body: JSON.stringify({ requiredClaims: ["age > 18"] }) });
  };

  const present = async () => {
    setStatus("pending");
    await fetch("/api/verify/present", { method: "POST", body: JSON.stringify({ claims: selected }) });
    const res = await fetch("/api/verify/validate", { method: "POST" });
    const data = await res.json();
    setStatus(data.valid ? "valid" : "invalid");
  };

  const onChainVerify = async () => {
    try {
      if (!credentialId || !CREDENTIAL_REGISTRY_ADDRESS) return;
      const provider = getBrowserProvider();
      if (!provider) return;
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CREDENTIAL_REGISTRY_ADDRESS, CredentialRegistryAbi as any, signer);
      const ok = await contract.verifyCredential(credentialId as any);
      setStatus(ok ? "valid" : "invalid");
    } catch (e) {
      console.warn("on-chain verify failed", e);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Verification</h1>
        <WalletConnector />
      </div>
      <div className="space-y-3">
        <button onClick={request} className="rounded-md border px-3 py-2">Request Claims</button>
        <ConsentSelector fields={["degree", "issuer", "issueDate", "age > 18"]} onChange={setSelected} />
        <button onClick={present} className="rounded-md bg-black px-3 py-2 text-white">Present</button>
        <div className="rounded-md border p-3">
          <div className="text-sm font-medium">On-chain Verification</div>
          <input className="mt-2 w-full rounded-md border px-3 py-2" placeholder="credentialId (0x...)" value={credentialId} onChange={(e) => setCredentialId(e.target.value)} />
          <button onClick={onChainVerify} className="mt-2 rounded-md border px-3 py-2">Verify On-chain</button>
          {!CREDENTIAL_REGISTRY_ADDRESS && <p className="text-xs text-zinc-500 mt-1">Set NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS to enable.</p>}
        </div>
        <VerificationResult status={status} />
      </div>
    </div>
  );
}
