/** Summary of a numeric series with gaps (null). */
export interface SeriesStats {
  first: number;
  last: number;
  min: number;
  max: number;
  avg: number;
  /** Relative change from first to last, e.g. 0.0123 for +1.23 %. */
  change: number;
  count: number;
}

export function seriesStats(values: readonly (number | null)[]): SeriesStats | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  const first = nums[0]!;
  const last = nums[nums.length - 1]!;
  let min = first;
  let max = first;
  let sum = 0;
  for (const n of nums) {
    if (n < min) min = n;
    if (n > max) max = n;
    sum += n;
  }
  return {
    first,
    last,
    min,
    max,
    avg: sum / nums.length,
    change: first === 0 ? 0 : (last - first) / first,
    count: nums.length,
  };
}

/** Relative change over the last `points` observations (last vs. the value `points` back). */
export function trailingChange(values: readonly (number | null)[], points: number): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length <= points) return null;
  const last = nums[nums.length - 1]!;
  const base = nums[nums.length - 1 - points]!;
  return base === 0 ? null : (last - base) / base;
}

/** Day-on-day change from an NBG quote: `diff` is absolute, in the same units as `rate`. */
export function dailyChange(rate: number, diff: number): number {
  const previous = rate - diff;
  return previous === 0 ? 0 : diff / previous;
}
