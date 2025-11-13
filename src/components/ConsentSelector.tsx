"use client";
import React from "react";

export function ConsentSelector({ fields, onChange }: { fields: string[]; onChange: (selected: string[]) => void }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const toggle = (f: string) => {
    const next = selected.includes(f) ? selected.filter((x) => x !== f) : [...selected, f];
    setSelected(next);
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <label key={f} className="flex items-center gap-2">
          <input type="checkbox" checked={selected.includes(f)} onChange={() => toggle(f)} />
          <span>{f}</span>
        </label>
      ))}
    </div>
  );
}
