/**
 * Thin client for the National Bank of Georgia public rates endpoint.
 *
 * The endpoint returns, for a given calendar date, every currency's official
 * rate against GEL. Rates are published on business days; a weekend or holiday
 * date returns the last published rate with `validFromDate` set accordingly.
 */

export const NBG_BASE = "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies";

export type Lang = "en" | "ka";

/** One currency as the NBG API returns it. */
export interface NbgCurrency {
  code: string;
  /** Rate is quoted per this many units (e.g. 100 JPY, 1000 KRW). */
  quantity: number;
  /** GEL per `quantity` units. */
  rate: number;
  /** Absolute change vs. the previous publication, in GEL per `quantity`. */
  diff: number;
  name: string;
  rateFormated: string;
  diffFormated: string;
  date: string;
  validFromDate: string;
}

export interface NbgDay {
  date: string;
  currencies: NbgCurrency[];
}

export type NbgResponse = NbgDay[];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "ka";
}

export function ratesUrl(date: string, lang: Lang = "en"): string {
  const params = new URLSearchParams({ date });
  return `${NBG_BASE}/${lang}/json/?${params.toString()}`;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const TBILISI = "Asia/Tbilisi";

/** The calendar date in Georgia for a given instant — NBG publishes against Tbilisi time. */
export function tbilisiDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TBILISI, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

/** Business days (Mon–Fri) ending at `end`, going back `days` calendar days. */
export function businessDays(end: Date, days: number): string[] {
  const out: string[] = [];
  const cursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  for (let i = 0; i < days; i++) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out.reverse();
}

export interface FetchLike {
  (input: string, init?: { signal?: AbortSignal }): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
  }>;
}

export class NbgError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "NbgError";
  }
}

function assertNbgResponse(body: unknown): asserts body is NbgResponse {
  if (!Array.isArray(body) || body.length === 0) throw new NbgError("Unexpected NBG payload");
  const day = body[0] as Partial<NbgDay>;
  if (typeof day.date !== "string" || !Array.isArray(day.currencies)) {
    throw new NbgError("Unexpected NBG payload");
  }
}

export async function fetchDay(
  date: string,
  lang: Lang,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 8000,
): Promise<NbgDay> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(ratesUrl(date, lang), { signal: controller.signal });
    if (!res.ok) throw new NbgError(`NBG responded ${res.status}`, 502);
    const body = await res.json();
    assertNbgResponse(body);
    return body[0]!;
  } finally {
    clearTimeout(timer);
  }
}

/** Run `tasks` with at most `limit` in flight. Rejections are returned, not thrown. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]!) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Compact history payload: one date axis, one number[] per currency, GEL per 1 unit. */
export interface HistoryPayload {
  dates: string[];
  series: Record<string, (number | null)[]>;
  /** Dates that could not be fetched; the UI treats them as gaps. */
  missing: string[];
}

export async function fetchHistory(
  dates: string[],
  fetchImpl: FetchLike = fetch,
  concurrency = 16,
): Promise<HistoryPayload> {
  const settled = await mapLimit(dates, concurrency, (d) => fetchDay(d, "en", fetchImpl));
  const okDays: NbgDay[] = [];
  const okDates: string[] = [];
  const missing: string[] = [];

  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      okDates.push(dates[i]!);
      okDays.push(r.value);
    } else {
      missing.push(dates[i]!);
    }
  });

  const codes = new Set<string>();
  for (const day of okDays) for (const c of day.currencies) codes.add(c.code);

  // Every series has exactly one slot per date; a currency absent on a date is a gap.
  const series: Record<string, (number | null)[]> = {};
  for (const code of codes) series[code] = okDays.map(() => null);
  okDays.forEach((day, k) => {
    for (const c of day.currencies) series[c.code]![k] = perUnit(c);
  });

  return { dates: okDates, series, missing };
}

/** Normalise an NBG quote to GEL per one unit of the currency. */
export function perUnit(c: Pick<NbgCurrency, "rate" | "quantity">): number {
  return c.quantity > 0 ? c.rate / c.quantity : c.rate;
}
