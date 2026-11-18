import type { IconName } from "@bwd/shared/icons";
import type { TabTriggerSlotProps } from "expo-router/ui";
import type { ReactNode } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMe } from "@/lib/me";
import { font, size, sp, useTheme } from "@/theme";
import { Count, Icon, T } from "@/ui";

export const TABS: { name: string; href: string; label: string; icon: IconName }[] = [
  { name: "index", href: "/", label: "Übersicht", icon: "home" },
  { name: "stundenplan", href: "/stundenplan", label: "Stundenplan", icon: "cal" },
  { name: "noten", href: "/noten", label: "Noten", icon: "chart" },
  { name: "(mehr)", href: "/mehr", label: "Mehr", icon: "grid4" },
];

/** Fläche der Tab-Bar. Liegt über dem Home-Indikator. */
export function TabBarView({ children, ...rest }: ViewProps & { children?: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View {...rest} accessibilityRole="tablist" style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: c.rule, backgroundColor: c.bg, paddingTop: sp[3], paddingHorizontal: sp[3], paddingBottom: Math.max(insets.bottom, sp[3]) }}>
      {children}
    </View>
  );
}

type BtnProps = TabTriggerSlotProps & { label: string; icon: IconName; withBadge?: boolean };

/** Ein Tab. Zähler an "Mehr": ungelesene Benachrichtigungen. */
export function TabButton({ label, icon, withBadge, isFocused, ref: _ref, style: _style, ...rest }: BtnProps) {
  const { c } = useTheme();
  const badge = useMe().data?.counts.unreadNotifications ?? 0;
  const color = isFocused ? c.ink : c.text2;
  const n = withBadge ? badge : 0;
  return (
    <Pressable {...rest} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} accessibilityLabel={n ? `${label}, ${n} neu` : label} style={{ flex: 1, alignItems: "center", gap: sp[1], minHeight: size.touchMin, paddingTop: sp[1] }}>
      <Icon name={icon} size={24} color={color} strokeWidth={isFocused ? 2 : 1.6} />
      <T style={{ fontFamily: font.body600, fontSize: 11, color }}>{label}</T>
      {n > 0 && (
        <View style={{ position: "absolute", top: -2, left: "50%", marginLeft: 6 }}>
          <Count n={n} />
        </View>
      )}
    </Pressable>
  );
}
