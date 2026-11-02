import { describe, expect, it } from "vitest";
import {
  businessDays,
  fetchHistory,
  isIsoDate,
  mapLimit,
  perUnit,
  ratesUrl,
  type FetchLike,
  type NbgDay,
} from "./nbg";
import { handleHistory, handleRates } from "./handlers";

function day(date: string, rates: Record<string, [rate: number, quantity: number]>): NbgDay {
  return {
    date: `${date}T00:00:00.000Z`,
    currencies: Object.entries(rates).map(([code, [rate, quantity]]) => ({
      code,
      quantity,
      rate,
      diff: 0,
      name: code,
      rateFormated: String(rate),
      diffFormated: "0",
      date: `${date}T00:00:00.000Z`,
      validFromDate: `${date}T00:00:00.000Z`,
    })),
  };
}

/** A fake NBG that answers from a map of date -> day, and 500s for anything else. */
function fakeNbg(days: Record<string, NbgDay>, log: string[] = []): FetchLike {
  return async (input) => {
    const date = new URL(input).searchParams.get("date")!;
    log.push(date);
    const hit = days[date];
    return {
      ok: Boolean(hit),
      status: hit ? 200 : 500,
      json: async () => (hit ? [hit] : { error: "nope" }),
    };
  };
}

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("26-02-28")).toBe(false);
    expect(isIsoDate(20260228)).toBe(false);
  });
});

describe("ratesUrl", () => {
  it("builds the NBG endpoint for a language and date", () => {
    expect(ratesUrl("2026-01-15", "ka")).toBe(
      "https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json/?date=2026-01-15",
    );
  });
});

describe("perUnit", () => {
  it("normalises quotes given per 100 or 1000 units", () => {
    expect(perUnit({ rate: 1.7745, quantity: 100 })).toBeCloseTo(0.017745);
    expect(perUnit({ rate: 2.0, quantity: 1000 })).toBeCloseTo(0.002);
    expect(perUnit({ rate: 2.7, quantity: 1 })).toBe(2.7);
  });
});

describe("businessDays", () => {
  it("returns Mon–Fri dates in ascending order within the window", () => {
    // 2026-11-02 is a Monday.
    const days = businessDays(new Date("2026-11-02T12:00:00Z"), 7);
    expect(days).toEqual(["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02"]);
  });
});

describe("mapLimit", () => {
  it("never exceeds the concurrency limit and keeps order", async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      if (n === 3) throw new Error("boom");
      return n * 10;
    });
    expect(peak).toBe(2);
    expect(results.map((r) => (r.status === "fulfilled" ? r.value : "x"))).toEqual([10, 20, "x", 40, 50]);
  });
});

describe("fetchHistory", () => {
  it("aligns every currency to the date axis and records missing days", async () => {
    const nbg = fakeNbg({
      "2026-01-05": day("2026-01-05", { USD: [2.7, 1], JPY: [1.8, 100] }),
      "2026-01-07": day("2026-01-07", { USD: [2.71, 1] }), // JPY absent
    });
    const out = await fetchHistory(["2026-01-05", "2026-01-06", "2026-01-07"], nbg);
    expect(out.dates).toEqual(["2026-01-05", "2026-01-07"]);
    expect(out.missing).toEqual(["2026-01-06"]);
    expect(out.series.USD).toEqual([2.7, 2.71]);
    expect(out.series.JPY?.[0]).toBeCloseTo(0.018);
    expect(out.series.JPY?.[1]).toBeNull();
  });
});

describe("handleRates", () => {
  const today = () => new Date("2026-03-10T09:00:00Z");

  it("rejects malformed input before touching the network", async () => {
    const log: string[] = [];
    const nbg = fakeNbg({}, log);
    expect((await handleRates({ date: "yesterday" }, { fetchImpl: nbg, now: today })).status).toBe(400);
    expect((await handleRates({ lang: "fr" }, { fetchImpl: nbg, now: today })).status).toBe(400);
    expect((await handleRates({ date: "2026-03-11" }, { fetchImpl: nbg, now: today })).status).toBe(400);
    expect(log).toEqual([]);
  });

  it("defaults to today and caches past days longer than today", async () => {
    const nbg = fakeNbg({
      "2026-03-10": day("2026-03-10", { USD: [2.7, 1] }),
      "2026-03-09": day("2026-03-09", { USD: [2.69, 1] }),
    });
    const now = await handleRates({}, { fetchImpl: nbg, now: today });
    const past = await handleRates({ date: "2026-03-09" }, { fetchImpl: nbg, now: today });
    expect(now.status).toBe(200);
    expect(now.headers["Cache-Control"]).toContain("s-maxage=1800");
    expect(past.headers["Cache-Control"]).toContain("s-maxage=86400");
  });

  it("maps upstream failures to 502", async () => {
    const res = await handleRates({ date: "2026-03-01" }, { fetchImpl: fakeNbg({}), now: today });
    expect(res.status).toBe(502);
    expect(res.headers["Cache-Control"]).toBe("no-store");
  });
});

describe("handleHistory", () => {
  it("only allows the supported ranges", async () => {
    const res = await handleHistory({ days: "45" }, { fetchImpl: fakeNbg({}) });
    expect(res.status).toBe(400);
  });
});
