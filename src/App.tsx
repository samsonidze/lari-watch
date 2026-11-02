import { useEffect, useMemo, useState } from "react";
import type { HistoryRange, Lang } from "./api/client";
import { useHistory, useRates } from "./api/queries";
import { CurrencyDetail } from "./components/CurrencyDetail";
import { Header } from "./components/Header";
import { Movers } from "./components/Movers";
import { RatesList } from "./components/RatesList";
import { DEFAULT_CODE } from "./lib/currencies";
import { formatDate, todayIso } from "./lib/format";
import { readStoredLang, storeLang, t } from "./lib/i18n";
import { useUrlParam } from "./hooks/useUrlState";
import { isIsoDate } from "../server/nbg";

export default function App() {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  const [code, setCode] = useUrlParam("cur", DEFAULT_CODE);
  const [dateParam, setDate] = useUrlParam("date", todayIso());
  const [range, setRange] = useState<HistoryRange>(30);
  const s = t(lang);

  const date = isIsoDate(dateParam) && dateParam <= todayIso() ? dateParam : todayIso();
  const rates = useRates(date === todayIso() ? undefined : date, lang);
  const history = useHistory(range);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${s.title} — ${s.tagline}`;
  }, [lang, s]);

  function setLang(next: Lang) {
    setLangState(next);
    storeLang(next);
  }

  const currencies = rates.data?.currencies ?? [];
  const selected = currencies.find((c) => c.code === code) ?? currencies[0];
  const names = useMemo(() => new Map(currencies.map((c) => [c.code, c.name])), [currencies]);

  return (
    <div className="min-h-screen">
      <Header lang={lang} onLang={setLang} date={date} onDate={setDate} />

      <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
        {rates.data && (
          <p className="mb-5 text-sm text-muted">
            {s.ratesFor} {formatDate(rates.data.date, lang)}
          </p>
        )}

        {rates.isPending && <p className="py-10 text-sm text-muted">{s.loading}</p>}

        {rates.isError && (
          <div className="py-10 text-sm">
            <p>
              {s.errorRates}{" "}
              <button type="button" onClick={() => rates.refetch()} className="text-accent underline-offset-2 hover:underline">
                {s.retry}
              </button>
            </p>
            <p className="mt-1 text-xs text-muted">{rates.error.message}</p>
          </div>
        )}

        {selected && (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:grid-rows-[auto_1fr]">
            <CurrencyDetail
              currency={selected}
              history={history.data}
              historyError={history.isError ? history.error.message : null}
              range={range}
              onRange={setRange}
              lang={lang}
              onRetryHistory={() => history.refetch()}
            />
            <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <RatesList currencies={currencies} selected={selected.code} onSelect={setCode} lang={lang} />
            </div>
            <div className="lg:col-start-1">
              <Movers history={history.data} names={names} onSelect={setCode} lang={lang} />
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-[1100px] px-4 pb-8 pt-10 text-xs text-muted sm:px-6">
        <p>
          {s.source}{" "}
          <a href="https://nbg.gov.ge/en/monetary-policy/currency" className="underline underline-offset-2 hover:text-ink">
            nbg.gov.ge
          </a>
        </p>
        <p className="mt-1">
          {s.builtBy}{" "}
          <a href="https://github.com/samsonidze/lari-watch" className="underline underline-offset-2 hover:text-ink">
            Giorgi Samsonidze
          </a>
        </p>
      </footer>
    </div>
  );
}
