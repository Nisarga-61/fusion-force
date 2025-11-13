"use client";
import WalletConnector from "@/components/WalletConnector";
import { useAppStore } from "@/store/useAppStore";
import { ethers } from "ethers";
import { getBrowserProvider } from "@/lib/web3";
import { DIDsAbi } from "@/lib/abis";
import { DIDS_ADDRESS } from "@/lib/addresses";

export default function Page() {
  const setDID = useAppStore((s) => s.setDID);

  const onChainCreate = async () => {
    const provider = getBrowserProvider();
    if (!provider || !DIDS_ADDRESS) return false;
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    const contract = new ethers.Contract(DIDS_ADDRESS, DIDsAbi as any, signer);
    const didString = `did:pkh:eip155:80001:${account}`;
    const didHash = ethers.keccak256(ethers.toUtf8Bytes(didString));
    const tx = await contract.createDID(account, didHash);
    await tx.wait();
    setDID({ id: didString });
    alert(`On-chain DID created for ${account}`);
    return true;
  };

  const createDID = async () => {
    try {
      const ok = await onChainCreate();
      if (ok) return;
    } catch (e) {
      console.warn("On-chain failed, falling back to stub", e);
    }
    const res = await fetch("/api/did/create", { method: "POST" });
    const data = await res.json();
    setDID({ id: data.did });
    alert(`DID created: ${data.did}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create DID</h1>
        <WalletConnector />
      </div>
      <button onClick={createDID} className="rounded-md bg-black px-3 py-2 text-white">Generate DID</button>
      {!DIDS_ADDRESS && <p className="text-xs text-zinc-500">Set NEXT_PUBLIC_DIDS_ADDRESS to enable on-chain creation.</p>}
    </div>
  );
}
