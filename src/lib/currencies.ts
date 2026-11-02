import type { NbgCurrency } from "../api/client";

/** Currencies people in Georgia actually check, in the order they expect them. */
export const PINNED = ["USD", "EUR", "GBP", "TRY", "RUB", "AMD", "AZN", "CNY", "CHF", "JPY"] as const;

const rank = new Map<string, number>(PINNED.map((c, i) => [c, i]));

export function sortCurrencies<T extends Pick<NbgCurrency, "code">>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = rank.get(a.code) ?? Number.POSITIVE_INFINITY;
    const rb = rank.get(b.code) ?? Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return a.code.localeCompare(b.code);
  });
}

export function matchesFilter(c: Pick<NbgCurrency, "code" | "name">, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
}

export const DEFAULT_CODE = "USD";
