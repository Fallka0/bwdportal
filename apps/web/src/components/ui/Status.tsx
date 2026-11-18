export type StatusTone = "warn" | "err" | "info" | "ok";

/** Status als ein farbiges Wort. Erledigt (ok) bleibt grau. Keine Pills. */
export function Status({ tone, children, className }: { tone: StatusTone; children: string; className?: string }) {
  return <span className={["stat", tone, className].filter(Boolean).join(" ")}>{children}</span>;
}
