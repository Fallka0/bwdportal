import type { IconName } from "@bwd/shared/icons";
import { useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { font, fs, radius, size, sp, useTheme } from "@/theme";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { T } from "./Text";

function Label({ text, children, error }: { text: string; children: ReactNode; error?: string }) {
  return (
    <View style={{ gap: sp[2] }}>
      <T v="label">{text}</T>
      {children}
      {error ? (
        <T v="smallStrong" tone="err">
          {error}
        </T>
      ) : null}
    </View>
  );
}

function useBox(error?: string) {
  const { c } = useTheme();
  return {
    minHeight: size.button,
    borderRadius: radius.l,
    backgroundColor: c.fieldBg,
    borderWidth: error ? 1.5 : 1,
    borderColor: error ? c.err : c.rule,
    paddingHorizontal: sp[6],
  };
}

/** Textfeld mit Label und Fehlertext am Feld. */
export function TextField({ label, error, multiline, ...rest }: TextInputProps & { label: string; error?: string }) {
  const { c } = useTheme();
  const box = useBox(error);
  const [focus, setFocus] = useState(false);
  return (
    <Label text={label} error={error}>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.text3}
        multiline={multiline}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={[box, { fontFamily: font.body, fontSize: fs.base, color: c.ink, paddingVertical: multiline ? sp[5] : 0, minHeight: multiline ? 96 : size.button, textAlignVertical: multiline ? "top" : "center" }, focus && { borderColor: c.focus, borderWidth: 2 }]}
        {...rest}
      />
    </Label>
  );
}

/** Nur lesbarer Wert in Feld-Optik. */
export function StaticField({ label, icon, children, end }: { label: string; icon?: IconName; children: string; end?: string }) {
  const box = useBox();
  return (
    <Label text={label}>
      <View style={[box, { flexDirection: "row", alignItems: "center", gap: sp[4] }]} accessible accessibilityLabel={`${label}: ${children}${end ? `, ${end}` : ""}`}>
        {icon && <Icon name={icon} small />}
        <T style={{ flex: 1 }}>{children}</T>
        {end && <T v="small">{end}</T>}
      </View>
    </Label>
  );
}

/** Auswahl: öffnet ein Sheet mit den Optionen (native Auswahllisten gibt es in RN nicht einheitlich). */
export function SelectField<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  const { c } = useTheme();
  const box = useBox();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <Label text={label}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${current?.label ?? ""}`} onPress={() => setOpen(true)} style={[box, { flexDirection: "row", alignItems: "center", gap: sp[4] }]}>
        <T style={{ flex: 1 }} numberOfLines={1}>
          {current?.label}
        </T>
        <Icon name="chev-d" small color={c.text2} />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o, i) => (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: o.value === value }}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
            style={{ minHeight: size.touchMin, flexDirection: "row", alignItems: "center", gap: sp[4], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule, paddingVertical: sp[4] }}
          >
            <T style={{ flex: 1 }}>{o.label}</T>
            {o.value === value && <Icon name="check" small />}
          </Pressable>
        ))}
      </Sheet>
    </Label>
  );
}

export function Switch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => onChange(!value)} hitSlop={9} style={{ width: size.touchMin, height: 26, borderRadius: radius.pill, backgroundColor: value ? c.ink : c.ruleStrong, justifyContent: "center" }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: value ? c.bg : c.raise, marginLeft: value ? 21 : 3 }} />
    </Pressable>
  );
}
