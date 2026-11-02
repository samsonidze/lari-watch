import type { Lang } from "../api/client";

const LOCALE: Record<Lang, string> = { en: "en-GB", ka: "ka-GE" };

/** GEL per unit, with enough precision for small-value currencies (JPY, KRW, UZS…). */
export function formatRate(value: number, lang: Lang): string {
  const digits = value >= 1 ? 4 : value >= 0.01 ? 5 : 7;
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatAmount(value: number, lang: Lang, maxDigits = 2): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

/** Signed percentage like "+0.42 %" or "−1.10 %" (true minus sign). */
export function formatPercent(ratio: number, lang: Lang): string {
  const pct = new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(ratio * 100);
  return `${pct.replace("-", "−")} %`;
}

export function formatDate(iso: string, lang: Lang, style: "long" | "short" = "long"): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    timeZone: "UTC",
    ...(style === "long"
      ? { weekday: "short", day: "numeric", month: "long", year: "numeric" }
      : { day: "numeric", month: "short" }),
  }).format(d);
}

/** Today's date in the user's own time zone (not UTC), as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
