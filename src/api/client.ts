import type { HistoryPayload, Lang, NbgCurrency, NbgDay } from "../../server/nbg";
import type { HistoryRange } from "../../server/handlers";

export type { HistoryPayload, Lang, NbgCurrency, NbgDay, HistoryRange };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export function fetchRates(date: string | undefined, lang: Lang, signal?: AbortSignal) {
  const params = new URLSearchParams({ lang });
  if (date) params.set("date", date);
  return getJson<NbgDay>(`/api/rates?${params}`, signal);
}

export function fetchHistory(days: HistoryRange, signal?: AbortSignal) {
  return getJson<HistoryPayload>(`/api/history?days=${days}`, signal);
}
