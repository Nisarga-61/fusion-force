"use client";
import React from "react";
import zxcvbn from "zxcvbn";

export default function PasswordStrength({ value }: { value: string }) {
  const result = React.useMemo(() => (value ? zxcvbn(value) : undefined), [value]);
  const score = result?.score ?? 0; // 0-4
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-pink-700", "bg-pink-600", "bg-pink-500", "bg-pink-400", "bg-pink-300"];
  return (
    <div aria-live="polite" className="mt-1">
      <div className="flex h-2 w-full overflow-hidden rounded bg-zinc-800">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-2 flex-1 ${i <= score-1 ? colors[score] : "bg-zinc-700"}`}></div>
        ))}
      </div>
      {value && <p className="mt-1 text-xs text-pink-300">{labels[score]}</p>}
    </div>
  );
}
