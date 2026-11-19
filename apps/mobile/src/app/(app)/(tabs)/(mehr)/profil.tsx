import type { Settings } from "@bwd/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Linking, Share, View } from "react-native";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, radius, sp, tracking, useTheme, type ThemePref } from "@/theme";
import { Button, Card, Segment, SkBox, SkeletonArea, Switch, T, useToast } from "@/ui";

const ROWS: { key: keyof Omit<Settings, "theme">; title: string; sub?: string }[] = [
  { key: "nTimetable", title: "Stundenplanänderungen", sub: "Ausfälle und Raumänderungen" },
  { key: "nGrades", title: "Neue Noten" },
  { key: "nNews", title: "Mitteilungen" },
  { key: "nAbsences", title: "Absenzen", sub: "Entscheid zu Dispensationsgesuchen" },
  { key: "nEmail", title: "Zusätzlich per E-Mail" },
];

export default function Profile() {
  const { c, pref, setPref } = useTheme();
  const me = useMe();
  const { signOut } = useAuth();
  const [local, setLocal] = useState<Partial<Settings>>({});
  const d = me.data;
  const s = d ? { ...d.settings, ...local } : null;

  const toggle = async (key: keyof Settings, v: boolean) => {
    setLocal((x) => ({ ...x, [key]: v }));
    try {
      await api.updateSettings({ [key]: v });
    } catch {
      setLocal((x) => ({ ...x, [key]: !v }));
    }
  };

  return (
    <Screen title="Profil" back={{ label: "Mehr", href: "/mehr" }} onRefresh={me.refresh} refreshing={me.refreshing}>
      {me.error && !d ? (
        <ErrorState message={me.error} onRetry={me.reload} />
      ) : !d || !s ? (
        <SkeletonArea label="Profil wird geladen">
          <SkBox h={480} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[7] }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18, padding: sp[7], borderRadius: radius.xl, backgroundColor: c.panel }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: c.btn, alignItems: "center", justifyContent: "center" }}>
              <T style={{ fontFamily: font.display400, fontSize: 18, color: c.btnFg }}>{d.initials}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T style={{ fontFamily: font.display, fontSize: 22, letterSpacing: tracking(22) }}>{d.name}</T>
              <T tone="text2">
                {d.classCode} · {d.email}
              </T>
            </View>
          </View>
          <Card>
            <T v="box" accessibilityRole="header" style={{ marginBottom: sp[6] }}>
              Benachrichtigungen
            </T>
            {ROWS.map((r, i) => (
              <View key={r.key} style={{ flexDirection: "row", alignItems: "center", gap: sp[6], minHeight: 52, paddingTop: i ? sp[6] : 0, paddingBottom: sp[6], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
                <View style={{ flex: 1 }}>
                  <T v="strong" style={{ fontFamily: font.body700 }}>
                    {r.title}
                  </T>
                  {r.sub && <T v="small">{r.sub}</T>}
                </View>
                <Switch label={r.title} value={!!s[r.key]} onChange={(v) => toggle(r.key, v)} />
              </View>
            ))}
          </Card>
          <Card>
            <T v="box" accessibilityRole="header" style={{ marginBottom: sp[6] }}>
              Konto
            </T>
            {[
              ["Klasse", d.classCode],
              ["Lehrgang", d.program ?? "–"],
              ["Klassenlehrperson", d.classTeacher ?? "–"],
              ["Anmeldung", "Demo-Konto"],
            ].map(([k, v]) => (
              <View key={k} style={{ flexDirection: "row", gap: sp[9], marginBottom: sp[4] }}>
                <T tone="text2" style={{ width: 128 }}>
                  {k}
                </T>
                <T v="strong" style={{ flex: 1 }}>
                  {v}
                </T>
              </View>
            ))}
          </Card>
          <Card>
            <T v="box" accessibilityRole="header" style={{ marginBottom: sp[6] }}>
              Darstellung
            </T>
            <T v="strong" style={{ fontFamily: font.body700, marginBottom: sp[3] }}>
              Design
            </T>
            <Segment<ThemePref>
              label="Design"
              value={pref}
              onChange={(v) => {
                setPref(v);
                api.updateSettings({ theme: v }).catch(() => {});
              }}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Hell" },
                { value: "dark", label: "Dunkel" },
              ]}
            />
          </Card>
          <CalendarCard />
          <Button
            label="Abmelden"
            variant="line"
            icon="logout"
            wide
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
          />
        </View>
      )}
    </Screen>
  );
}

/** Kalender-Abo: in der Kalender-App öffnen, Link teilen oder neu erstellen. */
function CalendarCard() {
  const toast = useToast();
  const cal = useApi(() => api.calendar(), [], { cache: "calendar" });
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<{ url: string; webcal: string } | null>(null);
  const urls = fresh ?? cal.data;
  return (
    <Card>
      <T v="box" accessibilityRole="header" style={{ marginBottom: sp[6] }}>
        Kalender
      </T>
      <T v="strong" style={{ fontFamily: font.body700 }}>
        Kalender abonnieren
      </T>
      <T v="small" style={{ marginBottom: sp[5] }}>
        Stundenplan, Prüfungen und SOL-Plan
      </T>
      <View style={{ gap: sp[3] }}>
        <Button label="Im Kalender öffnen" wide disabled={!urls} onPress={() => urls && Linking.openURL(urls.webcal)} />
        <Button label="Link teilen" variant="line" wide disabled={!urls} onPress={() => urls && Share.share({ message: urls.url })} />
        <Button
          label="Neuen Link erstellen"
          variant="ghost"
          wide
          busy={busy}
          onPress={async () => {
            setBusy(true);
            try {
              setFresh(await api.resetCalendar());
              toast.show("Neuer Link erstellt. Der alte funktioniert nicht mehr.");
            } catch {
              toast.show("Das hat nicht geklappt. Versuche es nochmals.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </Card>
  );
}
