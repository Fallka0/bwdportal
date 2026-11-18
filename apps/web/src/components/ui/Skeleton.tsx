import type { CSSProperties, ReactNode } from "react";

/** Grauer Balken in der Form des Inhalts. Pulsiert leicht, bei reduzierter Bewegung statisch. */
export function SkLine({ w, size }: { w: string; size?: "s" | "xl" }) {
  const style: CSSProperties = { width: w };
  return <i className={["sk-l", size && `sk-${size}`].filter(Boolean).join(" ")} style={style} />;
}

export function SkBox({ h, className, style }: { h: number; className?: string; style?: CSSProperties }) {
  return <span className={["sk", className].filter(Boolean).join(" ")} style={{ height: h, ...style }} />;
}

export function SkeletonArea({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sk-wrap" aria-busy="true" aria-label={label}>
      {children}
      <p className="sr" role="status">
        {label}
      </p>
    </div>
  );
}
