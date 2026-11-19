import type { IconName } from "@bwd/shared/icons";
import type { ReactNode } from "react";
import { View } from "react-native";
import { font, radius, sp, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

export function Empty({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: sp[4], paddingVertical: 48, paddingHorizontal: sp[9], borderRadius: radius.xl, borderWidth: 1, borderStyle: "dashed", borderColor: c.ruleStrong, marginBottom: sp[7] }}>
      <View style={{ width: 48, height: 48, borderRadius: radius.l, backgroundColor: c.panel, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} />
      </View>
      <T style={{ fontFamily: font.display400, fontSize: 20, lineHeight: 23, textAlign: "center", letterSpacing: -0.6 }}>{title}</T>
      {children}
    </View>
  );
}

/** Banner nur für Störungen und Login-Fehler. */
export function Banner({ tone = "warn", children, action }: { tone?: "warn" | "err"; children: ReactNode; action?: ReactNode }) {
  const { c } = useTheme();
  const fg = tone === "err" ? c.err : c.warn;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: sp[4], padding: sp[6], borderRadius: radius.l, backgroundColor: tone === "err" ? c.errBg : c.warnBg, marginBottom: sp[7] }}>
      <View style={{ paddingTop: 2 }}>
        <Icon name="alert" small color={fg} />
      </View>
      {/* Rolle "alert" auf dem Text: wird vorgelesen, der Knopf daneben bleibt einzeln erreichbar. */}
      <T accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ flex: 1, minWidth: 200, color: fg, lineHeight: 20 }}>
        {children}
      </T>
      {action}
    </View>
  );
}
