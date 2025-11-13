"use client";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Biometric Authentication (Stub)</h1>
      <p className="text-sm text-zinc-600">
        This demo uses device-native biometrics (e.g., Windows Hello, Face/Touch ID) in a future step. For now, this page is a placeholder.
      </p>
      <button className="rounded-md border px-3 py-2">Enroll</button>
      <button className="rounded-md bg-black px-3 py-2 text-white">Verify</button>
    </div>
  );
}
