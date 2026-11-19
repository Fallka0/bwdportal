import { fmtGrade, isInsufficient } from "@bwd/shared";
import { font, fs, tracking } from "@/theme";
import { T } from "./Text";

/** Note in Unbounded, unter 4.0 in Rot. */
export function Grade({ value, size = fs.h2 }: { value: number | null; size?: number }) {
  return (
    <T numeric tone={value !== null && isInsufficient(value) ? "err" : "ink"} style={{ fontFamily: font.display400, fontSize: size, letterSpacing: tracking(size) * 0.66, minWidth: 44, textAlign: "right" }}>
      {value !== null ? fmtGrade(value) : "–"}
    </T>
  );
}
