"use client";
import React from "react";

export function ZKPProofGenerator({ onGenerate }: { onGenerate: (proof: any) => void }) {
  const [loading, setLoading] = React.useState(false);

  const generate = async () => {
    setLoading(true);
    // Placeholder: integrate circom/ZoKrates later
    setTimeout(() => {
      onGenerate({ proof: "dummy-proof", publicSignals: [] });
      setLoading(false);
    }, 600);
  };

  return (
    <button onClick={generate} disabled={loading} className="rounded-md bg-indigo-600 px-3 py-2 text-white disabled:opacity-60">
      {loading ? "Generating..." : "Generate ZKP"}
    </button>
  );
}
