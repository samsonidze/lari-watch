import { useQuery } from "@tanstack/react-query";
import { fetchHistory, fetchRates, type HistoryRange, type Lang } from "./client";

export function useRates(date: string | undefined, lang: Lang) {
  return useQuery({
    queryKey: ["rates", date ?? "today", lang],
    queryFn: ({ signal }) => fetchRates(date, lang, signal),
    staleTime: 30 * 60 * 1000,
  });
}

export function useHistory(days: HistoryRange) {
  return useQuery({
    queryKey: ["history", days],
    queryFn: ({ signal }) => fetchHistory(days, signal),
    staleTime: 6 * 60 * 60 * 1000,
  });
}
