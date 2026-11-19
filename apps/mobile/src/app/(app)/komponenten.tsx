import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sp, ThemeScope, useTheme, type ThemePref } from "@/theme";
import {
  Banner,
  Button,
  Card,
  CardHead,
  Empty,
  Icon,
  IconButton,
  Kpis,
  ListRow,
  Segment,
  SelectField,
  Sheet,
  SkeletonArea,
  SkLine,
  StaticField,
  Status,
  Switch,
  T,
  TextField,
  TextTabs,
  useToast,
} from "@/ui";

/** Testseite der Design-Basis (Phase 1): alle Grundkomponenten, oben im gewählten Design, darunter beide fest. */
export default function Komponenten() {
  const { pref, setPref } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + sp[6], paddingBottom: insets.bottom + 120 }}>
      <View style={{ paddingHorizontal: sp[7], gap: sp[5], marginBottom: sp[7] }}>
        <T v="h1">Komponenten</T>
        <Segment<ThemePref>
          label="Design"
          value={pref}
          onChange={setPref}
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Hell" },
            { value: "dark", label: "Dunkel" },
          ]}
        />
      </View>
      <ThemeScope scheme="light">
        <Pane title="Hell" />
      </ThemeScope>
      <ThemeScope scheme="dark">
        <Pane title="Dunkel" />
      </ThemeScope>
    </ScrollView>
  );
}

function Pane({ title }: { title: string }) {
  const { c } = useTheme();
  const toast = useToast();
  const [seg, setSeg] = useState<"tag" | "woche">("tag");
  const [tab, setTab] = useState("alle");
  const [sol, setSol] = useState("auftraege");
  const [sw, setSw] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [task, setTask] = useState("fr");

  return (
    <View style={{ backgroundColor: c.bg, padding: sp[7], gap: sp[7] }}>
      <T v="h2">{title}</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[3] }}>
        <Button label="Absenz melden" icon="plus" />
        <Button label="Stundenplan" variant="line" />
        <Button label="Entschuldigen" small />
        <Button label="Erneut laden" small variant="line" />
        <Button label="Gesperrt" disabled />
        <Button
          label="Absenden"
          busy={busy}
          haptic
          onPress={() => {
            setBusy(true);
            setTimeout(() => setBusy(false), 1500);
          }}
        />
        <Button label="Abmelden" variant="out" icon="logout" />
        <IconButton icon="bell" label="Benachrichtigungen, 3 neu" badge={3} />
      </View>
      <Kpis
        items={[
          { label: "Offen", value: 2, tone: "warn" },
          { label: "Unentschuldigt", value: 1 },
          { label: "Entschuldigt", value: 2 },
        ]}
      />
      <Card>
        <CardHead title="Neue Noten" linkLabel="Alle Noten" onLink={() => {}} />
        <ListRow first title="Englisch" sub="Unit 4 Test · 22.10." end={<T v="h2" numeric style={{ fontFamily: "Unbounded_400Regular" }}>5.5</T>} />
        <ListRow title="Prüfungsplan 1. Semester ist online" sub="Schulleitung · 20.10.2026" onPress={() => {}} />
        <ListRow title="Do 22.10. · 2 Lektionen" sub="Französisch, Mathematik" end={<Status tone="warn" label="Offen" />} />
        <ListRow title="Di 29.09. · 1 Lektion" sub="Sport" end={<Status tone="err" label="Unentschuldigt" />} />
        <ListRow title="Fr 09.10. · 4 Lektionen" sub="Vormittag" end={<Status tone="ok" label="Entschuldigt" />} />
      </Card>
      <Segment label="Ansicht" value={seg} onChange={setSeg} options={[{ value: "tag", label: "Tag" }, { value: "woche", label: "Woche" }]} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[5] }}>
        <Switch label="Neue Noten" value={sw} onChange={setSw} />
        <T v="strong">Neue Noten</T>
      </View>
      <TextTabs label="SOL" lined value={sol} onChange={setSol} items={[{ value: "auftraege", label: "Aufträge" }, { value: "kalender", label: "Kalender" }, { value: "portfolio", label: "Portfolio" }]} />
      <TextTabs label="Kategorie" value={tab} onChange={setTab} items={[{ value: "alle", label: "Alle", count: 10 }, { value: "pp", label: "Prüfungspläne", count: 2 }, { value: "fo", label: "Formulare", count: 3 }]} />
      <Card>
        <View style={{ gap: sp[6] }}>
          <SelectField label="Auftrag" value={task} onChange={setTask} options={[{ value: "fr", label: "Französisch 3.01 · 45 Min." }, { value: "ma", label: "Mathematik 3.04 · 45 Min." }]} />
          <StaticField label="SOL-Tag" icon="cal">
            Freitag, 30. Oktober
          </StaticField>
          <View style={{ flexDirection: "row", gap: sp[4] }}>
            <View style={{ flex: 1 }}>
              <TextField label="Von" defaultValue="16:30" keyboardType="numbers-and-punctuation" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Bis" defaultValue="15:00" error="Bis muss nach Von liegen." />
            </View>
          </View>
          <TextField label="Notiz" multiline />
        </View>
      </Card>
      <Empty icon="search" title="Kein Dokument für «Zeugnis».">
        <Button label="Suche zurücksetzen" small variant="line" />
      </Empty>
      <Banner action={<Button label="Erneut laden" small variant="line" />}>
        <T v="strong" tone="warn">
          WebUntis antwortet gerade nicht.
        </T>{" "}
        Du siehst den Stundenplan von heute 07:58. Änderungen seither fehlen.
      </Banner>
      <SkeletonArea label="Wird geladen">
        <Card>
          <SkLine w="30%" />
          <SkLine w="70%" h={30} />
          <SkLine w="50%" />
        </Card>
      </SkeletonArea>
      <View style={{ flexDirection: "row", gap: sp[3], alignItems: "center", flexWrap: "wrap" }}>
        <Button label="Sheet öffnen" variant="line" onPress={() => setOpen(true)} />
        <Button label="Toast zeigen" variant="line" onPress={() => toast.show("Absenz gesendet. Deine Klassenlehrperson prüft sie.")} />
        <Icon name="swap" />
        <Icon name="cancel" />
        <Icon name="chart" />
      </View>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Einplanen"
        actions={
          <>
            <Button label="Abbrechen" variant="ghost" onPress={() => setOpen(false)} />
            <Button label="Einplanen" haptic onPress={() => setOpen(false)} />
          </>
        }
      >
        <StaticField label="SOL-Tag" icon="cal">
          Freitag, 30. Oktober
        </StaticField>
        <TextField label="Notiz" multiline />
      </Sheet>
    </View>
  );
}
