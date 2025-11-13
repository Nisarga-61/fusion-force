"use client";
import React from "react";
import { ZKPProofGenerator } from "@/components/ZKPProofGenerator";

export default function Page() {
  const [question, setQuestion] = React.useState("");
  const [misguidedAnswer, setMisguidedAnswer] = React.useState("");
  const [proof, setProof] = React.useState<any>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">ZKP Challenge Setup</h1>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Question</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="2 * 2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Displayed (misguided) Answer</label>
          <input className="mt-1 w-full rounded-md border px-3 py-2" value={misguidedAnswer} onChange={(e) => setMisguidedAnswer(e.target.value)} placeholder="10" />
        </div>
        <ZKPProofGenerator onGenerate={setProof} />
        {proof && (
          <pre className="rounded-md bg-zinc-100 p-3 text-xs">{JSON.stringify(proof, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
