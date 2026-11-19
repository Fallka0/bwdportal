import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  /** Zeitpunkt des ältesten angezeigten Offline-Stands, null = online */
  since: string | null;
  report: (key: string, offlineSince: string | null) => void;
  /** Zähler: steigt bei "Erneut laden", alle Ansichten laden neu */
  attempt: number;
  retry: () => void;
};

const OfflineCtx = createContext<Ctx>({ since: null, report: () => {}, attempt: 0, retry: () => {} });
export const useOffline = () => useContext(OfflineCtx);

/** Sammelt, welche Ansichten gerade einen gespeicherten Stand zeigen, weil das Portal nicht erreichbar ist. */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const [stale, setStale] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);
  const report = useCallback((key: string, offlineSince: string | null) => {
    setStale((s) => {
      if (offlineSince === null) {
        if (!(key in s)) return s;
        const next = { ...s };
        delete next[key];
        return next;
      }
      return s[key] === offlineSince ? s : { ...s, [key]: offlineSince };
    });
  }, []);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const since = useMemo(() => Object.values(stale).sort()[0] ?? null, [stale]);
  const value = useMemo(() => ({ since, report, attempt, retry }), [since, report, attempt, retry]);
  return <OfflineCtx.Provider value={value}>{children}</OfflineCtx.Provider>;
}
