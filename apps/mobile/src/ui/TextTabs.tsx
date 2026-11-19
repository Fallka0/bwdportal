import { Pressable, ScrollView, View } from "react-native";
import { font, fs, size, sp, useTheme } from "@/theme";
import { T } from "./Text";

/** Filter als Text-Tabs mit Unterstrich. `lined` = SOL-Tabs mit Linie darunter. */
export function TextTabs<V extends string>({ label, items, value, onChange, lined }: { label: string; items: { value: V; label: string; count?: number }[]; value: V; onChange: (v: V) => void; lined?: boolean }) {
  const { c } = useTheme();
  const row = items.map((it) => {
    const on = it.value === value;
    return (
      <Pressable
        key={it.value}
        accessibilityRole={lined ? "tab" : "button"}
        accessibilityState={lined ? { selected: on } : { selected: on }}
        onPress={() => onChange(it.value)}
        style={{ minHeight: size.touchMin, justifyContent: "center", flex: lined ? 1 : undefined, alignItems: lined ? "center" : undefined }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, paddingVertical: sp[2], borderBottomWidth: 2, borderBottomColor: on ? c.ink : "transparent" }}>
          <T style={{ fontFamily: font.body600, fontSize: lined ? fs.m : fs.base, color: on ? c.ink : c.text2 }}>{it.label}</T>
          {it.count !== undefined && <T v="small">{it.count}</T>}
        </View>
      </Pressable>
    );
  });
  if (lined) {
    return (
      <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.rule, marginBottom: sp[8] }}>
        {row}
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={label} contentContainerStyle={{ gap: sp[7] }} style={{ marginBottom: sp[6], flexGrow: 0 }}>
      {row}
    </ScrollView>
  );
}
