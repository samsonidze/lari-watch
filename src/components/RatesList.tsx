import { useMemo, useState } from "react";
import type { Lang, NbgCurrency } from "../api/client";
import { matchesFilter, sortCurrencies } from "../lib/currencies";
import { formatRate } from "../lib/format";
import { t } from "../lib/i18n";
import { dailyChange } from "../lib/stats";
import { perUnit } from "../../server/nbg";
import { Change } from "./Change";

interface Props {
  currencies: NbgCurrency[];
  selected: string;
  onSelect: (code: string) => void;
  lang: Lang;
}

export function RatesList({ currencies, selected, onSelect, lang }: Props) {
  const s = t(lang);
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => sortCurrencies(currencies).filter((c) => matchesFilter(c, query)),
    [currencies, query],
  );

  return (
    <section aria-label={s.currency}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={s.search}
        aria-label={s.search}
        className="mb-2 w-full rounded border border-rule bg-paper px-3 py-1.5 text-sm placeholder:text-muted"
      />
      <div className="grid grid-cols-[4rem_1fr_auto_auto] gap-x-3 border-b border-rule px-2 pb-1 text-xs text-muted">
        <span>{s.currency}</span>
        <span />
        <span className="text-right">{s.perUnit}</span>
        <span className="w-16 text-right">{s.change}</span>
      </div>
      <ul className="max-h-[70vh] overflow-y-auto">
        {rows.map((c) => {
          const active = c.code === selected;
          return (
            <li key={c.code}>
              <button
                type="button"
                onClick={() => onSelect(c.code)}
                aria-current={active ? "true" : undefined}
                className={`grid w-full grid-cols-[4rem_1fr_auto_auto] items-baseline gap-x-3 border-b border-rule px-2 py-2 text-left text-sm hover:bg-paper-2 ${
                  active ? "bg-paper-2 shadow-[inset_3px_0_0_var(--color-accent)]" : ""
                }`}
              >
                <span className="font-medium">{c.code}</span>
                <span className="truncate text-ink-2">{c.name}</span>
                <span className="num text-right">{formatRate(perUnit(c), lang)}</span>
                <Change ratio={dailyChange(c.rate, c.diff)} lang={lang} className="w-16 text-right text-xs" />
              </button>
            </li>
          );
        })}
        {rows.length === 0 && <li className="px-2 py-6 text-sm text-muted">{s.noMatch}</li>}
      </ul>
    </section>
  );
}
