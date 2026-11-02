/**
 * Framework-agnostic request handlers. `api/*.ts` adapts them for Vercel
 * functions and `server/vite-plugin.ts` serves the same code in `vite dev`,
 * so there is exactly one implementation of the proxy.
 */
import {
  businessDays,
  fetchDay,
  fetchHistory,
  isIsoDate,
  isLang,
  NbgError,
  toIsoDate,
  type FetchLike,
} from "./nbg";

export interface HandlerResult {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export const HISTORY_RANGES = [30, 90, 365] as const;
export type HistoryRange = (typeof HISTORY_RANGES)[number];

function isHistoryRange(n: number): n is HistoryRange {
  return (HISTORY_RANGES as readonly number[]).includes(n);
}

function errorResult(status: number, message: string): HandlerResult {
  return { status, headers: { ...JSON_HEADERS, "Cache-Control": "no-store" }, body: { error: message } };
}

function fromUnknownError(err: unknown): HandlerResult {
  if (err instanceof NbgError) return errorResult(err.status, err.message);
  if (err instanceof Error && err.name === "AbortError") return errorResult(504, "NBG timed out");
  return errorResult(502, "Upstream request failed");
}

/** GET /api/rates?date=YYYY-MM-DD&lang=en|ka — rates for one day (default: today). */
export async function handleRates(
  query: Record<string, string | undefined>,
  deps: { fetchImpl?: FetchLike; now?: () => Date } = {},
): Promise<HandlerResult> {
  const now = deps.now ?? (() => new Date());
  const date = query.date ?? toIsoDate(now());
  const lang = query.lang ?? "en";

  if (!isIsoDate(date)) return errorResult(400, "date must be YYYY-MM-DD");
  if (!isLang(lang)) return errorResult(400, "lang must be en or ka");
  if (date > toIsoDate(now())) return errorResult(400, "date is in the future");

  try {
    const day = await fetchDay(date, lang, deps.fetchImpl);
    // Past days never change; today's may be re-published, so cache it briefly.
    const isToday = date === toIsoDate(now());
    const cache = isToday
      ? "public, s-maxage=1800, stale-while-revalidate=3600"
      : "public, s-maxage=86400, stale-while-revalidate=604800";
    return { status: 200, headers: { ...JSON_HEADERS, "Cache-Control": cache }, body: day };
  } catch (err) {
    return fromUnknownError(err);
  }
}

/** GET /api/history?days=30|90|365 — per-unit GEL rates for every currency, business days only. */
export async function handleHistory(
  query: Record<string, string | undefined>,
  deps: { fetchImpl?: FetchLike; now?: () => Date } = {},
): Promise<HandlerResult> {
  const now = deps.now ?? (() => new Date());
  const days = Number(query.days ?? 30);
  if (!isHistoryRange(days)) return errorResult(400, `days must be one of ${HISTORY_RANGES.join(", ")}`);

  try {
    const payload = await fetchHistory(businessDays(now(), days), deps.fetchImpl);
    if (payload.dates.length === 0) return errorResult(502, "No data from NBG");
    return {
      status: 200,
      headers: { ...JSON_HEADERS, "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
      body: payload,
    };
  } catch (err) {
    return fromUnknownError(err);
  }
}
