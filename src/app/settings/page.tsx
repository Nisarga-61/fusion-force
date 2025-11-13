"use client";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <ul className="list-disc space-y-2 pl-6 text-sm text-zinc-700">
        <li>Change authentication method</li>
        <li>Privacy settings</li>
        <li>Manage consent NFTs (future)</li>
        <li>Export/backup credentials</li>
        <li>View audit logs</li>
      </ul>
    </div>
  );
}
