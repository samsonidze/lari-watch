import type { Lang } from "../api/client";

const strings = {
  en: {
    title: "Lari Watch",
    tagline: "Official exchange rates of the National Bank of Georgia",
    ratesFor: "Rates for",
    validFrom: "in force since",
    today: "Today",
    perUnit: "GEL per 1",
    change: "Change",
    dayChange: "vs previous day",
    currency: "Currency",
    rate: "Rate",
    search: "Filter currencies",
    noMatch: "No currency matches.",
    range: { 30: "30 days", 90: "90 days", 365: "1 year" },
    low: "Low",
    high: "High",
    average: "Average",
    period: "Over the period",
    convert: "Convert",
    amount: "Amount",
    swap: "Swap direction",
    movers: "Biggest moves this week",
    gained: "GEL weakened against",
    lost: "GEL strengthened against",
    loading: "Loading…",
    historyLoading: "Loading history…",
    errorRates: "Couldn't load rates from the National Bank.",
    errorHistory: "Couldn't load history.",
    retry: "Try again",
    source: "Source: National Bank of Georgia. Rates are set each business day and apply from the next day.",
    builtBy: "Built by",
    langToggle: "ქართული",
    datePick: "Pick a date",
    missingDays: (n: number) => `${n} day${n === 1 ? "" : "s"} unavailable`,
  },
  ka: {
    title: "ლარის კურსი",
    tagline: "საქართველოს ეროვნული ბანკის ოფიციალური კურსები",
    ratesFor: "კურსი",
    validFrom: "მოქმედებს",
    today: "დღეს",
    perUnit: "ლარი 1",
    change: "ცვლილება",
    dayChange: "წინა დღესთან",
    currency: "ვალუტა",
    rate: "კურსი",
    search: "ვალუტის ძებნა",
    noMatch: "ასეთი ვალუტა არ მოიძებნა.",
    range: { 30: "30 დღე", 90: "90 დღე", 365: "1 წელი" },
    low: "მინიმუმი",
    high: "მაქსიმუმი",
    average: "საშუალო",
    period: "პერიოდში",
    convert: "კონვერტაცია",
    amount: "თანხა",
    swap: "მიმართულების შეცვლა",
    movers: "კვირის ყველაზე დიდი ცვლილებები",
    gained: "ლარი გაუფასურდა",
    lost: "ლარი გამყარდა",
    loading: "იტვირთება…",
    historyLoading: "ისტორია იტვირთება…",
    errorRates: "კურსების ჩატვირთვა ვერ მოხერხდა.",
    errorHistory: "ისტორიის ჩატვირთვა ვერ მოხერხდა.",
    retry: "თავიდან ცდა",
    source: "წყარო: საქართველოს ეროვნული ბანკი. კურსი დგინდება ყოველ სამუშაო დღეს და მოქმედებს მომდევნო დღიდან.",
    builtBy: "ავტორი",
    langToggle: "English",
    datePick: "თარიღის არჩევა",
    missingDays: (n: number) => `${n} დღე მიუწვდომელია`,
  },
} as const;

export type Strings = (typeof strings)[Lang];

export function t(lang: Lang): Strings {
  return strings[lang];
}

const LANG_KEY = "lari-watch:lang";

export function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "en" || v === "ka") return v;
  } catch {
    // storage unavailable
  }
  return navigator.language.startsWith("ka") ? "ka" : "en";
}

export function storeLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}
