import { tname, pct } from "@/lib/model";
import { Flag } from "./Flag";

export function TeamChip({ id, className = "" }: { id: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Flag id={id} />
      <span className="truncate">{tname(id)}</span>
    </span>
  );
}

export function Bar({ p, gold = false }: { p: number; gold?: boolean }) {
  return (
    <div className={`bar h-2 w-full ${gold ? "gold" : ""}`}>
      <span style={{ width: `${Math.min(100, Math.max(p * 100, p > 0 ? 1.5 : 0))}%` }} />
    </div>
  );
}

export function Pct({ p, d = 1, className = "" }: { p: number; d?: number; className?: string }) {
  return <span className={`tabular ${className}`}>{pct(p, d)}</span>;
}

const CONF: Record<string, string> = {
  High: "text-up border-up/40 bg-up/10",
  Medium: "text-flux border-flux/40 bg-flux/10",
  "Toss-up": "text-down border-down/40 bg-down/10",
};
/** value = decisiveness 0–100 → the favoured side's win chance = 50 + value/2. */
export function Confidence({ label, value }: { label: string; value: number }) {
  const likely = Math.round(50 + value / 2);
  return (
    <span
      title="The model's chance that the predicted result happens"
      className={`chip px-2 py-0.5 text-[11px] font-medium ${CONF[label] ?? ""}`}
    >
      {likely}% likely
    </span>
  );
}

export function Score({ a, b, prob }: { a: number; b: number; prob?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <span className="tabular rounded-md border border-line bg-void2 px-1.5 py-0.5 font-semibold">
        {a}–{b}
      </span>
      {prob !== undefined && (
        <span className="tabular text-[11px] text-faint" title="How likely this exact scoreline is">
          {Math.round(prob * 100)}%
        </span>
      )}
    </span>
  );
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-bold tracking-tight">{children}</h2>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}
