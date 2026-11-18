import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { IconName } from "@bwd/shared/icons";
import { Icon } from "./Icon";

type Variant = "ink" | "line" | "ghost" | "out";
type Common = { variant?: Variant; small?: boolean; wide?: boolean; icon?: IconName; children: ReactNode };

function cls(variant: Variant, small?: boolean, wide?: boolean, extra?: string) {
  return ["btn", `btn-${variant}`, small && "btn-s", wide && "btn-wide", extra].filter(Boolean).join(" ");
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean };

/** Knopf. Primär (ink), sekundär (line), ohne Fläche (ghost). `busy` zeigt Fortschritt beim Absenden. */
export function Button({ variant = "ink", small, wide, icon, busy, children, className, type = "button", disabled, ...rest }: ButtonProps) {
  return (
    <button type={type} className={cls(variant, small, wide, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <span className="spin" aria-hidden="true" /> : icon ? <Icon name={icon} small /> : null}
      {children}
    </button>
  );
}

type LinkButtonProps = Common & { href: string; external?: boolean; className?: string };

export function LinkButton({ variant = "ink", small, wide, icon, href, external, children, className }: LinkButtonProps) {
  const c = cls(variant, small, wide, className);
  if (external) {
    return (
      <a className={c} href={href} target="_blank" rel="noopener noreferrer">
        {icon && <Icon name={icon} small />}
        {children}
      </a>
    );
  }
  return (
    <Link className={c} href={href}>
      {icon && <Icon name={icon} small />}
      {children}
    </Link>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; small?: boolean };

export function IconButton({ icon, label, small, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button type={type} className={["ib", className].filter(Boolean).join(" ")} aria-label={label} title={label} {...rest}>
      <Icon name={icon} small={small} />
    </button>
  );
}
