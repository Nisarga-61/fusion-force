import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold">PixelGenesis</div>
        <nav className="flex gap-4 text-sm">
          <Link href="/auth" className="hover:underline">Auth</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/did/create" className="hover:underline">Create DID</Link>
          <Link href="/credentials/issue" className="hover:underline">Issue</Link>
          <Link href="/verify" className="hover:underline">Verify</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="grid gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Decentralized Digital Identity & Credential Vault</h1>
            <p className="mt-4 text-zinc-600">Create a DID, issue credentials, selectively disclose claims, and verify on-chain. Optional ZKP and biometric flows included.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/did/create" className="rounded-md bg-black px-4 py-2 text-white">Create Identity</Link>
              <Link href="/credentials/issue" className="rounded-md border px-4 py-2">Issue Test Credential</Link>
              <Link href="/verify" className="rounded-md border px-4 py-2">Start Verification</Link>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium">MVP Demo Flow</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-6 text-sm text-zinc-700">
              <li>Create Identity (DID)</li>
              <li>Issue test credential</li>
              <li>Store in wallet</li>
              <li>Share with selective disclosure</li>
              <li>Blockchain verification</li>
            </ol>
          </div>
        </section>
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="font-medium">Selective Disclosure</div>
            <p className="text-sm text-zinc-600">Reveal only required fields. Example: prove age {">"} 18 without sharing birthdate.</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium">ZKP Challenge-Response</div>
            <p className="text-sm text-zinc-600">Mismatched answers that only you can prove you know.</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium">Consent NFTs (Future)</div>
            <p className="text-sm text-zinc-600">Dynamic on-chain permissions and revocation.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
