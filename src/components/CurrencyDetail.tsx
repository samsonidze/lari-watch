import { lazy, Suspense } from "react";
import type { HistoryPayload, HistoryRange, Lang, NbgCurrency } from "../api/client";
import { HISTORY_RANGES } from "../../server/handlers";
import { perUnit } from "../../server/nbg";
import { formatDate, formatRate } from "../lib/format";
import { t } from "../lib/i18n";
import { dailyChange, seriesStats } from "../lib/stats";
import { Change } from "./Change";
import { Converter } from "./Converter";

const RateChart = lazy(() => import("./RateChart"));

interface Props {
  currency: NbgCurrency;
  history: HistoryPayload | undefined;
  historyError: string | null;
  range: HistoryRange;
  onRange: (r: HistoryRange) => void;
  lang: Lang;
  onRetryHistory: () => void;
}

export function CurrencyDetail({ currency, history, historyError, range, onRange, lang, onRetryHistory }: Props) {
  const s = t(lang);
  const rate = perUnit(currency);
  const series = history?.series[currency.code];
  const stats = series ? seriesStats(series) : null;

  return (
    <section aria-labelledby="detail-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="detail-heading" className="text-base text-ink-2">
          <span className="font-semibold text-ink">{currency.code}</span> · {currency.name}
          {currency.quantity !== 1 && (
            <span className="text-muted"> ({currency.quantity} {currency.code} = {currency.rateFormated} GEL)</span>
          )}
        </h2>
        <p className="text-xs text-muted">
          {s.validFrom} {formatDate(currency.validFromDate, lang)}
        </p>
      </div>

      <p className="mt-2 flex flex-wrap items-baseline gap-x-4">
        <span className="num text-5xl font-semibold tracking-tight sm:text-6xl">{formatRate(rate, lang)}</span>
        <span className="text-muted">{s.perUnit} {currency.code}</span>
      </p>
      <p className="mt-1 text-sm">
        <Change ratio={dailyChange(currency.rate, currency.diff)} lang={lang} />{" "}
        <span className="text-muted">{s.dayChange}</span>
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-y-2">
        <div role="group" aria-label={s.period} className="flex gap-1 text-sm">
          {HISTORY_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRange(r)}
              aria-pressed={r === range}
              className={`whitespace-nowrap rounded px-2.5 py-1 ${
                r === range ? "bg-ink text-paper" : "border border-rule hover:bg-paper-2"
              }`}
            >
              {s.range[r]}
            </button>
          ))}
        </div>
        {stats && (
          <p className="text-sm">
            <Change ratio={stats.change} lang={lang} /> <span className="text-muted">{s.period.toLowerCase()}</span>
          </p>
        )}
      </div>

      <div className="mt-3 min-h-[240px]">
        {historyError ? (
          <p className="py-10 text-sm text-muted">
            {s.errorHistory}{" "}
            <button type="button" onClick={onRetryHistory} className="text-accent underline-offset-2 hover:underline">
              {s.retry}
            </button>
          </p>
        ) : history && series ? (
          <Suspense fallback={<p className="py-10 text-sm text-muted">{s.historyLoading}</p>}>
            <RateChart dates={history.dates} values={series} lang={lang} />
          </Suspense>
        ) : (
          <p className="py-10 text-sm text-muted">{s.historyLoading}</p>
        )}
      </div>

      {stats && (
        <dl className="mt-2 grid grid-cols-3 gap-x-4 border-t border-rule pt-3 text-sm">
          <div>
            <dt className="text-muted">{s.low}</dt>
            <dd className="num">{formatRate(stats.min, lang)}</dd>
          </div>
          <div>
            <dt className="text-muted">{s.high}</dt>
            <dd className="num">{formatRate(stats.max, lang)}</dd>
          </div>
          <div>
            <dt className="text-muted">{s.average}</dt>
            <dd className="num">{formatRate(stats.avg, lang)}</dd>
          </div>
        </dl>
      )}
      {history && history.missing.length > 0 && (
        <p className="mt-1 text-xs text-muted">{s.missingDays(history.missing.length)}</p>
      )}

      <div className="mt-6">
        <Converter code={currency.code} rate={rate} lang={lang} />
      </div>
    </section>
  );
}
