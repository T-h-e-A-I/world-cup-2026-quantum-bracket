import { TEAMS } from "@/lib/model";

/** Real flag image (flagcdn raster — small + fast vs SVG), uniform rounded square. */
export function Flag({ id, className }: { id: number; className?: string }) {
  const t = TEAMS[id];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${t.iso}.png`}
      alt={t.name}
      loading="lazy"
      decoding="async"
      className={
        className ??
        "inline-block h-3.5 w-5 shrink-0 rounded-[3px] object-cover ring-1 ring-black/5"
      }
    />
  );
}
