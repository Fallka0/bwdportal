import { iconData, type IconName } from "@bwd/shared/icons";

type Props = { name: IconName; small?: boolean; className?: string };

/** Icon aus den gemeinsamen Daten. Immer dekorativ: Beschriftung trägt der Knopf oder Link. */
export function Icon({ name, small, className }: Props) {
  return (
    <svg className={["ic", small && "ic-s", className].filter(Boolean).join(" ")} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {iconData[name].map((s, i) => {
        if (s.t === "path") return <path key={i} d={s.d} fill={"fill" in s ? "currentColor" : undefined} stroke={"fill" in s ? "none" : undefined} />;
        if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={"fill" in s ? "currentColor" : undefined} stroke={"fill" in s ? "none" : undefined} />;
        return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />;
      })}
    </svg>
  );
}
