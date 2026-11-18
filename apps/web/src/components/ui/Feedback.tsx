import type { ReactNode } from "react";
import type { IconName } from "@bwd/shared/icons";
import { Icon } from "./Icon";

/** Leerzustand: Icon, ein Satz, optional eine Aktion. */
export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-i">
        <Icon name={icon} />
      </span>
      <b>{title}</b>
      {children}
    </div>
  );
}

/** Banner nur für Störungen und Login-Fehler. */
export function Banner({ tone = "warn", children, action }: { tone?: "warn" | "err"; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={tone === "err" ? "banner err" : "banner"} role="alert">
      <Icon name="alert" small />
      <span>{children}</span>
      {action}
    </div>
  );
}
