"use client";
import { TEAMS } from "@/lib/model";

export default function TeamSelect({
  value, onChange, exclude, label,
}: {
  value: number;
  onChange: (id: number) => void;
  exclude?: number;
  label?: string;
}) {
  const left = TEAMS.filter((t) => t.half === 0);
  const right = TEAMS.filter((t) => t.half === 1);
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs uppercase tracking-widest text-faint">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink outline-none focus:border-quantum"
      >
        <optgroup label="Left half">
          {left.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === exclude}>
              {t.flag} {t.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Right half">
          {right.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === exclude}>
              {t.flag} {t.name}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
