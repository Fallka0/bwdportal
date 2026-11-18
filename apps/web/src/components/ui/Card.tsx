import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

export function Card({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={["card", className].filter(Boolean).join(" ")} {...rest} />;
}

/** Kopf einer Karte: Titel links, optional ein Link "Alle" rechts. */
export function CardHead({ id, title, href, linkLabel = "Alle" }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="row-h">
      <h2 id={id} className="box-t">
        {title}
      </h2>
      {href && (
        <Link className="alink" href={href}>
          {linkLabel}
          <Icon name="arrow-r" small />
        </Link>
      )}
    </div>
  );
}

export function Kpis({ items }: { items: { label: string; value: ReactNode; tone?: "warn" | "err" }[] }) {
  return (
    <dl className="kpis">
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <dt>
            <span>{k.label}</span>
          </dt>
          <dd>
            <b className={k.tone}>{k.value}</b>
          </dd>
        </div>
      ))}
    </dl>
  );
}
