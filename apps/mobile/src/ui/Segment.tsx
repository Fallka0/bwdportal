import { Pressable, View } from "react-native";
import { font, fs, radius, useTheme } from "@/theme";
import { T } from "./Text";

/** Umschalter. In der App über die ganze Breite. Aktiv = raise. */
export function Segment<V extends string>({ label, options, value, onChange }: { label: string; options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={{ flexDirection: "row", padding: 3, borderRadius: radius.pill, backgroundColor: c.panel }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={{ flex: 1, height: 38, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: on ? c.onBg : "transparent" }}
          >
            <T style={{ fontFamily: font.body600, fontSize: fs.m, color: on ? c.ink : c.text2 }}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
