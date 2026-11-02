import { useCallback, useEffect, useState } from "react";

/** A string piece of state mirrored into the URL query, so views are shareable. */
export function useUrlParam(key: string, fallback: string): [string, (v: string) => void] {
  const read = () => new URLSearchParams(window.location.search).get(key) ?? fallback;
  const [value, setValue] = useState<string>(read);

  useEffect(() => {
    const onPop = () => setValue(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: string) => {
      setValue(next);
      const url = new URL(window.location.href);
      if (next === fallback) url.searchParams.delete(key);
      else url.searchParams.set(key, next);
      window.history.replaceState(null, "", url);
    },
    [key, fallback],
  );

  return [value, set];
}
