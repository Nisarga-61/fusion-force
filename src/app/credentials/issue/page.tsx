"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppStore } from "@/store/useAppStore";
import WalletConnector from "@/components/WalletConnector";
import { ethers } from "ethers";
import { getBrowserProvider } from "@/lib/web3";
import { CredentialRegistryAbi } from "@/lib/abis";
import { CREDENTIAL_REGISTRY_ADDRESS } from "@/lib/addresses";

const Schema = z.object({
  type: z.string().min(1),
  issuer: z.string().min(1),
  holder: z.string().min(1),
  holderAddress: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

export default function Page() {
  const addCredential = useAppStore((s) => s.addCredential);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const issueOnChain = async (values: FormValues) => {
    const provider = getBrowserProvider();
    if (!provider || !CREDENTIAL_REGISTRY_ADDRESS) return undefined;
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CREDENTIAL_REGISTRY_ADDRESS, CredentialRegistryAbi as any, signer);
    const holderAddr = (values.holderAddress && values.holderAddress.startsWith("0x")) ? values.holderAddress : undefined;
    if (!holderAddr) return undefined;
    const ipfsBytes32 = ethers.zeroPadValue("0x1234", 32) as `0x${string}`;
    const tx = await contract.issueCredential(holderAddr, values.type, ipfsBytes32, "0x");
    const receipt = await tx.wait();
    // Try to get returned credentialId from logs or call static compute: contract returns bytes32
    const credentialId = await contract.verifyCredential.staticCall ? undefined : undefined; // placeholder not needed
    return { credentialId: tx.hash }; // Fallback to tx hash as id for demo
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const onchain = await issueOnChain(values);
      if (onchain?.credentialId) {
        addCredential({ id: onchain.credentialId, type: values.type, issuer: values.issuer, issueDate: new Date().toISOString(), status: "valid" });
        alert(`On-chain issued: ${onchain.credentialId}`);
        return;
      }
    } catch (e) {
      console.warn("On-chain issuance failed, falling back", e);
    }
    const res = await fetch("/api/credentials/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    addCredential({ id: data.credentialId, type: values.type, issuer: values.issuer, issueDate: new Date().toISOString(), status: "valid" });
    alert(`Issued credential ${data.credentialId}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Issue Credential</h1>
        <WalletConnector />
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Type</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Degree Certificate" {...register("type")} />
          {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Issuer</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="University of X" {...register("issuer")} />
          {errors.issuer && <p className="text-sm text-red-600">{errors.issuer.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Holder DID</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="did:example:123" {...register("holder")} />
          {errors.holder && <p className="text-sm text-red-600">{errors.holder.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Holder Address (0x...)</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="0x... (required for on-chain)" {...register("holderAddress")} />
        </div>
        <button type="submit" className="rounded-md bg-black px-3 py-2 text-white">Issue</button>
        {!CREDENTIAL_REGISTRY_ADDRESS && <p className="text-xs text-zinc-500">Set NEXT_PUBLIC_CREDENTIAL_REGISTRY_ADDRESS for on-chain issuance.</p>}
      </form>
    </div>
  );
}
