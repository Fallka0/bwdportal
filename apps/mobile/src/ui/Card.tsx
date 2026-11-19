import type { ReactNode } from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, sp, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

/** Karte: panel, Radius 18, kein Schatten, keine Linie. */
export function Card({ children, style, pad = sp[7] }: { children: ReactNode; style?: StyleProp<ViewStyle>; pad?: number }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.panel, borderRadius: radius.xl, padding: pad }, style]}>{children}</View>;
}

export function CardHead({ title, linkLabel = "Alle", onLink }: { title: string; linkLabel?: string; onLink?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: sp[5] }}>
      <T v="box" accessibilityRole="header">
        {title}
      </T>
      {onLink && (
        <Pressable accessibilityRole="link" onPress={onLink} hitSlop={10} style={{ flexDirection: "row", alignItems: "center", gap: sp[3], minHeight: 36 }}>
          <T v="label">{linkLabel}</T>
          <Icon name="arrow-r" small />
        </Pressable>
      )}
    </View>
  );
}

export function Kpis({ items }: { items: { label: string; value: ReactNode; tone?: "warn" | "err" }[] }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: sp[3], marginBottom: sp[5] }}>
      {items.map((k) => (
        <View key={k.label} accessible accessibilityLabel={`${k.label} ${String(k.value)}`} style={{ flex: 1, backgroundColor: c.panel, borderRadius: radius.l, paddingVertical: sp[5], paddingHorizontal: sp[6], gap: sp[1] }}>
          <T v="small" style={{ fontSize: 11 }}>
            {k.label}
          </T>
          <T v="kpi" tone={k.tone} numeric>
            {k.value}
          </T>
        </View>
      ))}
    </View>
  );
}
