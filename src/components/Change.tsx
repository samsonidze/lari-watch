import type { Lang } from "../api/client";
import { formatPercent } from "../lib/format";

/** A signed percentage coloured by direction. Zero stays neutral. */
export function Change({ ratio, lang, className = "" }: { ratio: number | null; lang: Lang; className?: string }) {
  if (ratio === null) return <span className={`text-muted ${className}`}>—</span>;
  const tone = ratio > 0 ? "text-up" : ratio < 0 ? "text-down" : "text-muted";
  return (
    <span className={`num ${tone} ${className}`}>
      {formatPercent(ratio, lang)}
    </span>
  );
}
