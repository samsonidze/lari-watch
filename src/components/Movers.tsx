import { useMemo } from "react";
import type { HistoryPayload, Lang } from "../api/client";
import { t } from "../lib/i18n";
import { trailingChange } from "../lib/stats";
import { Change } from "./Change";

interface Props {
  history: HistoryPayload | undefined;
  names: Map<string, string>;
  onSelect: (code: string) => void;
  lang: Lang;
}

const WEEK = 5; // business days

/** The five currencies GEL moved most against over the last business week, each way. */
export function Movers({ history, names, onSelect, lang }: Props) {
  const s = t(lang);
  const moves = useMemo(() => {
    if (!history) return [];
    return Object.entries(history.series)
      .map(([code, values]) => ({ code, change: trailingChange(values, WEEK) }))
      .filter((m): m is { code: string; change: number } => m.change !== null && names.has(m.code))
      .sort((a, b) => b.change - a.change);
  }, [history, names]);

  const up = moves.filter((m) => m.change > 0).slice(0, 5);
  const down = moves.filter((m) => m.change < 0).slice(-5).reverse();
  if (up.length === 0 && down.length === 0) return null;

  const Column = ({ title, items }: { title: string; items: typeof moves }) => (
    <div>
      <h3 className="mb-1 text-xs text-muted">{title}</h3>
      <ul className="divide-y divide-rule">
        {items.map((m) => (
          <li key={m.code}>
            <button
              type="button"
              onClick={() => onSelect(m.code)}
              className="flex w-full items-baseline justify-between gap-3 py-1.5 text-left text-sm hover:text-accent"
            >
              <span>
                <span className="font-medium">{m.code}</span>{" "}
                <span className="text-ink-2">{names.get(m.code)}</span>
              </span>
              <Change ratio={m.change} lang={lang} className="text-xs" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section aria-label={s.movers} className="border-t border-rule pt-4">
      <h2 className="mb-3 text-sm font-medium">{s.movers}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {up.length > 0 && <Column title={s.gained} items={up} />}
        {down.length > 0 && <Column title={s.lost} items={down} />}
      </div>
    </section>
  );
}
