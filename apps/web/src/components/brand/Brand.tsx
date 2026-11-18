import Link from "next/link";
import { microsoftLogo } from "@bwd/shared/icons";

/** Wortmarke "bwd Portal". `light` = helle Marke auf dunkler Sidebar. */
export function Wordmark({ href, light, compact }: { href?: string; light?: boolean; compact?: boolean }) {
  const inner = (
    <>
      <span className={light ? "mark mark-light" : "mark"}>bwd</span>
      <span className={compact ? "wm-t sr-compact" : "wm-t"}>Portal</span>
    </>
  );
  return href ? (
    <Link className="wm" href={href} aria-label="bwd Portal, Übersicht">
      {inner}
    </Link>
  ) : (
    <span className="wm">{inner}</span>
  );
}

export function MicrosoftLogo() {
  return (
    <span className="msq" aria-hidden="true">
      {microsoftLogo.map((c) => (
        <i key={c} style={{ background: c }} />
      ))}
    </span>
  );
}
