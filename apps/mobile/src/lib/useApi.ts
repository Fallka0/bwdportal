import { ApiFailure } from "@bwd/shared/api";
import { useCallback, useEffect, useRef, useState } from "react";

export type ApiState<T> = { data: T | null; error: string | null; loading: boolean; refreshing: boolean; reload: () => void; refresh: () => Promise<void> };

const message = (e: unknown) => (e instanceof ApiFailure ? e.message : "Etwas ist schiefgelaufen.");

/**
 * Daten laden mit Zuständen: lädt, Fehler (mit "Erneut laden"), Pull-to-Refresh.
 * "lädt" ergibt sich aus dem Schlüssel der Anfrage, darum kein setState direkt im Effekt.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [n, setN] = useState(0);
  const key = JSON.stringify([n, ...deps]);
  const [res, setRes] = useState<{ key: string; data: T | null; error: string | null }>({ key: "", data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let alive = true;
    fnRef
      .current()
      .then((data) => alive && setRes({ key, data, error: null }))
      .catch((e: unknown) => alive && setRes((r) => ({ key, data: r.data, error: message(e) })));
    return () => {
      alive = false;
    };
  }, [key]);

  const reload = useCallback(() => setN((x) => x + 1), []);
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fnRef.current();
      setRes((r) => ({ key: r.key, data, error: null }));
    } catch (e) {
      setRes((r) => ({ ...r, error: message(e) }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const current = res.key === key;
  return { data: res.data, error: current ? res.error : null, loading: !current, refreshing, reload, refresh };
}
