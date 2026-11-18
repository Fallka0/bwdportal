import type { IconName } from "@bwd/shared/icons";
import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { font, fs, radius, size, sp, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

type Variant = "ink" | "line" | "ghost" | "out";
type Props = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: Variant;
  small?: boolean;
  icon?: IconName;
  busy?: boolean;
  wide?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Knopf: Höhe 44 (klein 36), rund. Gedrückt scale .98. `haptic` gibt beim Absenden Rückmeldung. */
export function Button({ label, variant = "ink", small, icon, busy, wide, haptic, disabled, onPress, style, ...rest }: Props) {
  const { c } = useTheme();
  const bg = variant === "ink" ? c.btn : "transparent";
  const fg = variant === "ink" ? c.btnFg : variant === "out" ? c.err : c.ink;
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      hitSlop={small ? 4 : 0}
      onPress={(e) => {
        if (haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          height: small ? size.buttonSmall : size.button,
          paddingHorizontal: small ? sp[6] : sp[8],
          borderRadius: radius.pill,
          backgroundColor: pressed && variant === "ghost" ? c.panel2 : pressed && variant === "ink" ? c.btnHover : bg,
          borderWidth: variant === "line" || variant === "out" ? 1 : 0,
          borderColor: c.ruleStrong,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: small ? sp[2] : sp[3],
          opacity: off && !busy ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          alignSelf: wide ? "stretch" : "flex-start",
        },
        style,
      ]}
      {...rest}
    >
      {busy ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} small color={fg} /> : null}
      <T style={{ fontFamily: font.body600, fontSize: small ? fs.m : fs.base, color: fg }} numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}

export function IconButton({ icon, label, onPress, color, badge }: { icon: IconName; label: string; onPress?: () => void; color?: string; badge?: number }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={2}
      onPress={onPress}
      style={({ pressed }) => ({ width: size.touchMin, height: size.touchMin, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? c.panel2 : "transparent" })}
    >
      <Icon name={icon} color={color} />
      {!!badge && (
        <View style={{ position: "absolute", top: 5, right: 5 }}>
          <Count n={badge} />
        </View>
      )}
    </Pressable>
  );
}

/** Zähler an Glocke und Navigation. */
export function Count({ n }: { n: number }) {
  const { c } = useTheme();
  return (
    <View style={{ minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: radius.pill, backgroundColor: c.live, alignItems: "center", justifyContent: "center" }}>
      <T v="micro" style={{ color: c.frame, lineHeight: 16 }}>
        {n}
      </T>
    </View>
  );
}
