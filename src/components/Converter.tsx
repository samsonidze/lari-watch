import { useState } from "react";
import type { Lang } from "../api/client";
import { formatAmount } from "../lib/format";
import { t } from "../lib/i18n";

interface Props {
  code: string;
  /** GEL per 1 unit of `code`. */
  rate: number;
  lang: Lang;
}

export function Converter({ code, rate, lang }: Props) {
  const s = t(lang);
  const [amount, setAmount] = useState("100");
  const [toGel, setToGel] = useState(true);

  const n = Number(amount.replace(",", "."));
  const valid = Number.isFinite(n) && n >= 0;
  const result = valid ? (toGel ? n * rate : n / rate) : null;
  const from = toGel ? code : "GEL";
  const to = toGel ? "GEL" : code;

  return (
    <div className="border-t border-rule pt-4">
      <h3 className="mb-2 text-sm text-muted">{s.convert}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="sr-only">{s.amount}</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={!valid}
            className={`num w-32 rounded border bg-paper px-2 py-1 text-right ${valid ? "border-rule" : "border-down"}`}
          />
          <span className="w-10 font-medium">{from}</span>
        </label>
        <button
          type="button"
          onClick={() => setToGel((v) => !v)}
          aria-label={s.swap}
          title={s.swap}
          className="rounded border border-rule px-2 py-1 text-sm hover:bg-paper-2"
        >
          ⇄
        </button>
        <output className="num text-lg font-medium" aria-live="polite">
          {result === null ? "—" : formatAmount(result, lang, result < 1 ? 4 : 2)}{" "}
          <span className="text-base font-normal text-muted">{to}</span>
        </output>
      </div>
    </div>
  );
}
