import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

type Props = { title: ReactNode; sub?: ReactNode; end?: ReactNode; href?: string };

/** Listenzeile: Titel 14/600, darunter Sekundärzeile 12, rechts Wert oder Pfeil. */
export function ListRow({ title, sub, end, href }: Props) {
  const body = (
    <>
      <span>
        <span className="lr-t">{title}</span>
        {sub && <span className="lr-s">{sub}</span>}
      </span>
      {end ?? (href ? <Icon name="chev-r" small className="chev" /> : null)}
    </>
  );
  if (href) {
    return (
      <Link className="lr" href={href}>
        {body}
      </Link>
    );
  }
  return <div className="lr">{body}</div>;
}
