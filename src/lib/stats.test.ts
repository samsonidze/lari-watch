import { describe, expect, it } from "vitest";
import { dailyChange, seriesStats, trailingChange } from "./stats";

describe("seriesStats", () => {
  it("ignores gaps and reports first/last/min/max/avg/change", () => {
    const s = seriesStats([2.7, null, 2.8, 2.6, 2.75])!;
    expect(s.first).toBe(2.7);
    expect(s.last).toBe(2.75);
    expect(s.min).toBe(2.6);
    expect(s.max).toBe(2.8);
    expect(s.avg).toBeCloseTo(2.7125);
    expect(s.change).toBeCloseTo(0.0185, 3);
    expect(s.count).toBe(4);
  });

  it("returns null for an empty or all-gap series", () => {
    expect(seriesStats([])).toBeNull();
    expect(seriesStats([null, null])).toBeNull();
  });
});

describe("trailingChange", () => {
  it("compares the last value with the one n observations back", () => {
    expect(trailingChange([1, 2, 3, 4], 2)).toBeCloseTo(1); // 4 vs 2
    expect(trailingChange([1, 2], 5)).toBeNull();
  });
});

describe("dailyChange", () => {
  it("derives a percentage from NBG's absolute diff", () => {
    // rate went 2.70 -> 2.727, diff = +0.027
    expect(dailyChange(2.727, 0.027)).toBeCloseTo(0.01);
    expect(dailyChange(2.7, 0)).toBe(0);
  });
});
