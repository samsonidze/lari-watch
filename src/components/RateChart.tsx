import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Lang } from "../api/client";
import { formatDate, formatRate } from "../lib/format";

interface Props {
  dates: string[];
  values: (number | null)[];
  lang: Lang;
}

export default function RateChart({ dates, values, lang }: Props) {
  const data = dates.map((date, i) => ({ date, value: values[i] ?? null }));
  const nums = values.filter((v): v is number => v !== null);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pad = (max - min || max * 0.01) * 0.15;
  const tickEvery = Math.max(1, Math.round(dates.length / 6));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => formatDate(d, lang, "short")}
          interval={tickEvery - 1}
          tickLine={false}
          axisLine={{ stroke: "var(--color-rule)" }}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tickFormatter={(v: number) => formatRate(v, lang)}
          width={72}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted)", fontSize: 11 }}
          tickCount={4}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-rule)" }}
          contentStyle={{
            background: "var(--color-paper)",
            border: "1px solid var(--color-rule)",
            borderRadius: 4,
            fontSize: 12,
            color: "var(--color-ink)",
          }}
          labelFormatter={(d) => formatDate(String(d), lang)}
          formatter={(v) => [formatRate(Number(v), lang), "GEL"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-accent)"
          strokeWidth={1.75}
          dot={false}
          activeDot={{ r: 3, fill: "var(--color-accent)", stroke: "var(--color-paper)" }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
