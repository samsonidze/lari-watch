import type { Lang } from "../api/client";
import { t } from "../lib/i18n";
import { todayIso } from "../lib/format";

interface Props {
  lang: Lang;
  onLang: (l: Lang) => void;
  date: string;
  onDate: (d: string) => void;
}

export function Header({ lang, onLang, date, onDate }: Props) {
  const s = t(lang);
  const today = todayIso();
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-x-8 gap-y-3 px-4 py-5 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold leading-tight">{s.title}</h1>
          <p className="text-sm text-muted">{s.tagline}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted">{s.ratesFor}</span>
            <input
              type="date"
              value={date}
              max={today}
              aria-label={s.datePick}
              onChange={(e) => e.target.value && onDate(e.target.value)}
              className="num rounded border border-rule bg-paper px-2 py-1 text-ink"
            />
          </label>
          {date !== today && (
            <button type="button" onClick={() => onDate(today)} className="text-accent underline-offset-2 hover:underline">
              {s.today}
            </button>
          )}
          <button
            type="button"
            onClick={() => onLang(lang === "en" ? "ka" : "en")}
            lang={lang === "en" ? "ka" : "en"}
            className="rounded border border-rule px-2 py-1 hover:bg-paper-2"
          >
            {s.langToggle}
          </button>
        </div>
      </div>
    </header>
  );
}
