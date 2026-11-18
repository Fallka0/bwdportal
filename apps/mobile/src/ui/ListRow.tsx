import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { size, sp, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { T } from "./Text";

/** Listenzeile: Titel 14/600, Sekundärzeile 12, rechts Wert oder Pfeil. Trennlinie rule. */
export function ListRow({ title, sub, end, onPress, first }: { title: ReactNode; sub?: ReactNode; end?: ReactNode; onPress?: () => void; first?: boolean }) {
  const { c } = useTheme();
  const content = (
    <>
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof title === "string" ? <T v="strong">{title}</T> : title}
        {sub ? typeof sub === "string" ? <T v="small">{sub}</T> : sub : null}
      </View>
      {end ?? (onPress ? <Icon name="chev-r" small color={c.text2} /> : null)}
    </>
  );
  const style = { flexDirection: "row" as const, alignItems: "center" as const, gap: sp[7], minHeight: size.touchMin, paddingTop: first ? 0 : sp[5], paddingBottom: sp[5], borderTopWidth: first ? 0 : 1, borderTopColor: c.rule };
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}
