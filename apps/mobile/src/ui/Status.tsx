import { T } from "./Text";

export type StatusTone = "warn" | "err" | "info" | "ok";

/** Status als ein farbiges Wort. Erledigt bleibt grau. Keine Pills. */
export function Status({ tone, label }: { tone: StatusTone; label: string }) {
  return (
    <T v="label" tone={tone === "ok" ? "text2" : tone}>
      {label}
    </T>
  );
}
