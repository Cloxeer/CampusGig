import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Tab (or similar) stored in a search param. Missing/invalid values are
 * replaced in-place so the first paint does not add a history entry.
 */
export function useQueryTab(allowed, defaultTab, param = "tab") {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(param);
  const tab = allowed.has(raw) ? raw : defaultTab;

  useEffect(() => {
    if (searchParams.get(param) === tab) return;
    const next = new URLSearchParams(searchParams);
    next.set(param, tab);
    setSearchParams(next, { replace: true });
  }, [param, tab, searchParams, setSearchParams]);

  const setTab = useCallback(
    (nextTab) => {
      if (!allowed.has(nextTab)) return;
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(param, nextTab);
        return next;
      });
    },
    [allowed, param, setSearchParams]
  );

  return [tab, setTab];
}
