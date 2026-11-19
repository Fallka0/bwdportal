import type { Me } from "@bwd/shared";
import { createContext, useContext, type ReactNode } from "react";
import { api } from "./api";
import { useApi, type ApiState } from "./useApi";

const MeCtx = createContext<ApiState<Me> | null>(null);

/** Angemeldete Person mit Zählern (Glocke, Mehr). Wird nach Aktionen neu geladen. */
export function MeProvider({ children }: { children: ReactNode }) {
  const state = useApi(() => api.me(), [], { cache: "me" });
  return <MeCtx.Provider value={state}>{children}</MeCtx.Provider>;
}

export function useMe() {
  const c = useContext(MeCtx);
  if (!c) throw new Error("useMe ausserhalb von MeProvider");
  return c;
}
