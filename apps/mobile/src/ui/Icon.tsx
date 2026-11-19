import { iconData, type IconName } from "@bwd/shared/icons";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { size as sz, useTheme } from "@/theme";

/** Icon aus den gemeinsamen Daten (gleiche Formen wie im Web). Immer dekorativ. */
export function Icon({ name, small, size, color, strokeWidth = 1.6 }: { name: IconName; small?: boolean; size?: number; color?: string; strokeWidth?: number }) {
  const { c } = useTheme();
  const s = size ?? (small ? sz.iconSmall : sz.icon);
  const stroke = color ?? c.ink;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {iconData[name].map((sh, i) => {
        if (sh.t === "path") return <Path key={i} d={sh.d} {...("fill" in sh ? { fill: stroke, stroke: "none" } : {})} />;
        if (sh.t === "circle") return <Circle key={i} cx={sh.cx} cy={sh.cy} r={sh.r} {...("fill" in sh ? { fill: stroke, stroke: "none" } : {})} />;
        return <Rect key={i} x={sh.x} y={sh.y} width={sh.width} height={sh.height} rx={sh.rx} />;
      })}
    </Svg>
  );
}
