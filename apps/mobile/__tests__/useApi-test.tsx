import { ApiFailure } from "@bwd/shared/api";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { readCache, writeCache } from "@/lib/cache";
import { OfflineProvider, useOffline } from "@/lib/offline";
import { useApi } from "@/lib/useApi";

const wrapper = ({ children }: { children: ReactNode }) => <OfflineProvider>{children}</OfflineProvider>;

describe("useApi mit Zwischenspeicher", () => {
  it("speichert die Antwort und meldet online", async () => {
    const { result } = await renderHook(() => useApi(() => Promise.resolve({ n: 1 }), [], { cache: "t1" }), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
    expect(result.current.offlineSince).toBeNull();
    await waitFor(async () => expect((await readCache<{ n: number }>("t1:[]"))?.data).toEqual({ n: 1 }));
  });

  it("ohne Verbindung: gespeicherter Stand mit Zeitpunkt, kein Fehler", async () => {
    await writeCache("t2:[]", { n: 2 }, "2026-11-19T07:58");
    const { result } = await renderHook(
      () => ({ api: useApi(() => Promise.reject(new ApiFailure(0, "offline", "Keine Verbindung zum Portal.")), [], { cache: "t2" }), offline: useOffline() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.api.offlineSince).toBe("2026-11-19T07:58"));
    expect(result.current.api.data).toEqual({ n: 2 });
    expect(result.current.api.error).toBeNull();
    expect(result.current.offline.since).toBe("2026-11-19T07:58");
  });

  it("ohne Verbindung und ohne Speicher: Fehler mit Text", async () => {
    const { result } = await renderHook(() => useApi(() => Promise.reject(new ApiFailure(0, "offline", "Keine Verbindung zum Portal.")), [], { cache: "t3" }), { wrapper });
    await waitFor(() => expect(result.current.error).toBe("Keine Verbindung zum Portal."));
    expect(result.current.data).toBeNull();
  });

  it("Erneut laden versucht es nochmals und löscht den Offline-Hinweis", async () => {
    await writeCache("t4:[]", { n: 0 }, "2026-11-19T07:58");
    let online = false;
    const fn = jest.fn(() => (online ? Promise.resolve({ n: 4 }) : Promise.reject(new ApiFailure(0, "offline", "x"))));
    const { result } = await renderHook(() => ({ api: useApi(fn, [], { cache: "t4" }), offline: useOffline() }), { wrapper });
    await waitFor(() => expect(result.current.offline.since).not.toBeNull());
    online = true;
    await act(() => result.current.offline.retry());
    await waitFor(() => expect(result.current.api.data).toEqual({ n: 4 }));
    expect(result.current.offline.since).toBeNull();
  });
});
