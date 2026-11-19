import { getNow } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "./cache";
import { useOffline } from "./offline";

export type ApiState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  /** Zeitpunkt des gespeicherten Stands, wenn das Portal nicht erreichbar ist */
  offlineSince: string | null;
  reload: () => void;
  refresh: () => Promise<void>;
};

const message = (e: unknown) => (e instanceof ApiFailure ? e.message : "Etwas ist schiefgelaufen.");
const isOffline = (e: unknown) => e instanceof ApiFailure && e.code === "offline";

/**
 * Daten laden mit Zuständen: lädt, Fehler (mit "Erneut laden"), Pull-to-Refresh.
 * Mit `cache` wird die letzte gute Antwort gespeichert: sie erscheint sofort beim Öffnen
 * und bleibt ohne Verbindung sichtbar (mit Hinweis auf den Stand).
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = [], opts: { cache?: string } = {}): ApiState<T> {
  const offline = useOffline();
  const [n, setN] = useState(0);
  const key = JSON.stringify([n, offline.attempt, ...deps]);
  const cacheKey = opts.cache ? `${opts.cache}:${JSON.stringify(deps)}` : null;
  const [res, setRes] = useState<{ key: string; data: T | null; error: string | null; offlineSince: string | null }>({ key: "", data: null, error: null, offlineSince: null });
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });
  const { report } = offline;

  useEffect(() => {
    let alive = true;
    let cached: { data: T; at: string } | null = null;
    // Gespeicherten Stand sofort zeigen, solange die frische Antwort unterwegs ist.
    if (cacheKey) {
      readCache<T>(cacheKey).then((c) => {
        cached = c;
        if (alive && c) setRes((r) => (r.data === null ? { ...r, data: c.data } : r));
      });
    }
    fnRef
      .current()
      .then((data) => {
        if (!alive) return;
        setRes({ key, data, error: null, offlineSince: null });
        if (cacheKey) {
          report(cacheKey, null);
          void writeCache(cacheKey, data, getNow().stamp);
        }
      })
      .catch(async (e: unknown) => {
        if (!alive) return;
        const c = cached ?? (cacheKey ? await readCache<T>(cacheKey) : null);
        if (isOffline(e) && c) {
          setRes({ key, data: c.data, error: null, offlineSince: c.at });
          if (cacheKey) report(cacheKey, c.at);
        } else setRes((r) => ({ key, data: r.data, error: message(e), offlineSince: null }));
      });
    return () => {
      alive = false;
    };
  }, [key, cacheKey, report]);

  const reload = useCallback(() => setN((x) => x + 1), []);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fnRef.current();
      setRes((r) => ({ key: r.key, data, error: null, offlineSince: null }));
      if (cacheKey) {
        report(cacheKey, null);
        void writeCache(cacheKey, data, getNow().stamp);
      }
    } catch (e) {
      if (!isOffline(e)) setRes((r) => ({ ...r, error: message(e) }));
    } finally {
      setRefreshing(false);
    }
  }, [cacheKey, report]);

  const current = res.key === key;
  return { data: res.data, error: current ? res.error : null, loading: !current, refreshing, offlineSince: current ? res.offlineSince : null, reload, refresh };
}
