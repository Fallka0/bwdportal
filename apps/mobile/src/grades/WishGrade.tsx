import { fmtGrade, neededGrade } from "@bwd/shared";
import { useState } from "react";
import { View } from "react-native";
import { font, fs, sp } from "@/theme";
import { Card, SelectField, T, TextField } from "@/ui";

/** "Was brauche ich?": Wunschnote und Gewicht der nächsten Probe → nötige Note (wie die Zeugnisnote gerundet). */
export function WishGrade({ entries, current, module }: { entries: { value: number; weight: number }[]; current: number | null; module: boolean }) {
  const weights = entries.map((e) => e.weight).filter((w) => w > 0);
  const common = weights.length ? [...weights].sort((a, b) => weights.filter((x) => x === b).length - weights.filter((x) => x === a).length)[0]! : 1;
  const targets = [4, 4.5, 5, 5.5, 6];
  const start = current === null ? 4 : (targets.find((t) => t > current) ?? 6);
  const [target, setTarget] = useState(String(start));
  const [weight, setWeight] = useState(String(common));
  const w = Number(weight.replace(",", "."));
  const r = Number.isFinite(w) && w > 0 ? neededGrade(entries, Number(target), w, module ? "module" : "subject") : null;
  return (
    <Card>
      <T v="box" accessibilityRole="header" style={{ marginBottom: sp[4] }}>
        Was brauche ich?
      </T>
      <View style={{ flexDirection: "row", gap: sp[5] }}>
        <View style={{ flex: 1 }}>
          <SelectField label={module ? "Modulnote" : "Zeugnisnote"} value={target} onChange={setTarget} options={targets.map((t) => ({ value: String(t), label: fmtGrade(t) }))} />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Gewicht der Probe" value={weight} keyboardType="decimal-pad" onChangeText={setWeight} />
        </View>
      </View>
      <T accessibilityLiveRegion="polite" style={{ marginTop: sp[4], fontSize: fs.l }}>
        {!r ? (
          "Gewicht fehlt."
        ) : r.kind === "safe" ? (
          `Schon sicher: auch mit einer 1 bleibt es mindestens eine ${fmtGrade(Number(target))}.`
        ) : r.kind === "impossible" ? (
          `Mit einer Probe nicht erreichbar, höchstens ${fmtGrade(r.best)}.`
        ) : (
          <>
            Du brauchst mindestens eine <T style={{ fontFamily: font.display400, fontSize: fs.h3 }}>{fmtGrade(r.value)}</T>.
          </>
        )}
      </T>
    </Card>
  );
}
