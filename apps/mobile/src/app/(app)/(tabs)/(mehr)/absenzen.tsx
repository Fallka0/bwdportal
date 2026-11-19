import { ABSENCE_REASONS, absenceDueDate, addDays, fmtMedium, fmtShortLoose, monthShort, plural, weekday, type Absence } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { storage } from "@/lib/storage";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, size, sp, useTheme } from "@/theme";
import { Button, Card, Empty, Icon, Kpis, Segment, SelectField, Sheet, SkBox, SkeletonArea, StaticField, Status, T, useToast, type StatusTone } from "@/ui";

const STATUS: Record<Absence["status"], [StatusTone, string]> = {
  open: ["warn", "Offen"],
  sent: ["info", "In Prüfung"],
  excused: ["ok", "Entschuldigt"],
  unexcused: ["err", "Unentschuldigt"],
};

const subline = (a: Absence) => (a.status === "open" || a.status === "sent" ? (a.dueDate ? `bis ${fmtShortLoose(a.dueDate)} entschuldigen` : "") : a.status === "unexcused" ? "Frist verpasst" : (a.reason ?? ""));

type Target = { kind: "excuse"; absence: Absence } | { kind: "report" } | null;

export default function Absences() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ entschuldigen?: string; melden?: string }>();
  const abs = useApi(() => api.absences(), [], { cache: "absences" });
  const me = useMe();
  const [picked, setPicked] = useState<Target>(null);
  // Links aus der Übersicht (?entschuldigen=… oder ?melden=1) öffnen den Dialog; einmal geschlossen bleibt er zu.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const urlKey = params.entschuldigen ?? (params.melden ? "melden" : null);
  const fromUrl: Target =
    urlKey && urlKey !== dismissed && abs.data
      ? urlKey === "melden"
        ? { kind: "report" }
        : (() => {
            const a = abs.data.items.find((x) => x.id === urlKey && x.status === "open");
            return a ? { kind: "excuse", absence: a } : null;
          })()
      : null;
  const target = picked ?? fromUrl;
  const setTarget = (t: Target) => {
    setPicked(t);
    if (!t) setDismissed(urlKey);
  };

  const d = abs.data;
  return (
    <Screen title="Absenzen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={abs.refresh} refreshing={abs.refreshing}>
      {abs.error && !d ? (
        <ErrorState message={abs.error} onRetry={abs.reload} />
      ) : !d ? (
        <SkeletonArea label="Absenzen werden geladen">
          <View style={{ gap: sp[3] }}>
            <SkBox h={72} r={radius.l} />
            <SkBox h={44} r={radius.pill} />
            <SkBox h={440} />
          </View>
        </SkeletonArea>
      ) : (
        <>
          <Kpis
            items={[
              { label: "Offen", value: d.counts.open, tone: d.counts.open ? "warn" : undefined },
              { label: "Unentschuldigt", value: d.counts.unexcused },
              { label: "Entschuldigt", value: d.counts.excused },
            ]}
          />
          <Button label="Absenz melden" icon="plus" wide onPress={() => setTarget({ kind: "report" })} style={{ marginBottom: sp[5] }} />
          {d.items.length === 0 ? (
            <Empty icon="check" title="Keine Absenzen." />
          ) : (
            <Card>
              {d.items.map((a, i) => {
                const [tone, label] = STATUS[a.status];
                const row = (
                  <View style={{ flexDirection: "row", gap: sp[5], alignItems: "flex-start", paddingTop: i ? sp[6] : 0, paddingBottom: sp[6], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
                    <View style={{ width: 46, alignItems: "center", paddingVertical: sp[2], borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule }}>
                      <T style={{ fontFamily: font.display400, fontSize: fs.h3, lineHeight: 20 }}>{a.date.slice(8)}</T>
                      <T style={{ fontFamily: font.body700, fontSize: fs.micro, color: c.text2 }}>{monthShort(a.date).replace(".", "").toUpperCase()}</T>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <T v="strong" style={{ fontFamily: font.body700 }}>
                        {plural(a.lessons.length, "Lektion", "Lektionen")} · {a.subjectsLabel}
                      </T>
                      {!!subline(a) && <T v="small">{subline(a)}</T>}
                      <View style={{ marginTop: sp[1] }}>
                        <Status tone={tone} label={label} />
                      </View>
                    </View>
                  </View>
                );
                return a.status === "open" ? (
                  <Pressable key={a.id} accessibilityRole="button" accessibilityLabel={`${a.date}, ${a.subjectsLabel}, offen. Entschuldigen`} onPress={() => setTarget({ kind: "excuse", absence: a })} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    {row}
                  </Pressable>
                ) : (
                  <View key={a.id} accessible accessibilityLabel={`${a.date}, ${a.subjectsLabel}, ${label}`}>
                    {row}
                  </View>
                );
              })}
            </Card>
          )}
        </>
      )}
      {target && (
        <AbsenceSheet
          target={target}
          onClose={() => setTarget(null)}
          onSent={async () => {
            setTarget(null);
            await Promise.all([abs.refresh(), me.refresh()]);
          }}
        />
      )}
    </Screen>
  );
}

type Reason = (typeof ABSENCE_REASONS)[number];
type DayLesson = { period: number; subjectCode: string | null; subjectName: string | null; subjectShort: string | null };
const lessonLabel = (l: DayLesson) => (l.subjectName && l.subjectName.length <= 12 ? l.subjectName : (l.subjectShort ?? l.subjectName ?? "SOL"));

function AbsenceSheet({ target, onClose, onSent }: { target: Exclude<Target, null>; onClose: () => void; onSent: () => Promise<void> }) {
  const { c } = useTheme();
  const toast = useToast();
  const clock = useApi(() => api.home(), [], { cache: "home" });
  const days = target.kind === "report" && clock.data ? lastSchoolDays(clock.data.today) : [];
  const [date, setDate] = useState<string>(target.kind === "excuse" ? target.absence.date : "");
  const effectiveDate = date || days[0] || "";
  const lessons = useApi(() => (effectiveDate ? api.absenceLessons(effectiveDate) : Promise.resolve({ lessons: [] })), [effectiveDate]);
  const [periods, setPeriods] = useState<number[]>(target.kind === "excuse" ? target.absence.lessons.map((l) => l.period) : []);
  const [reason, setReason] = useState<Reason>("Krankheit");
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const due = target.kind === "excuse" ? target.absence.dueDate : effectiveDate ? absenceDueDate(effectiveDate) : null;

  async function pick() {
    setFileError("");
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png"], copyToCacheDirectory: true });
    if (r.canceled) return;
    const f = r.assets[0]!;
    if (f.size && f.size > 5 * 1024 * 1024) return setFileError("Die Datei ist grösser als 5 MB.");
    setFile(f);
  }

  async function send() {
    if (!periods.length) return;
    setBusy(true);
    setError("");
    try {
      let attachmentKey: string | undefined;
      if (file) {
        const fd = new FormData();
        if (file.file) fd.append("file", file.file);
        else fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType ?? "application/octet-stream" } as unknown as Blob);
        const token = await storage.get("session");
        const res = await fetch(`${API_URL}/api/v1/absences/attachment`, { method: "POST", body: fd, headers: token ? { authorization: `Bearer ${token}` } : {} });
        const body = (await res.json().catch(() => null)) as { key?: string; error?: { message: string } } | null;
        if (!res.ok || !body?.key) {
          setFileError(body?.error?.message ?? "Hochladen fehlgeschlagen.");
          return;
        }
        attachmentKey = body.key;
      }
      await api.submitAbsence(target.kind === "excuse" ? { absenceId: target.absence.id, periods, reason, attachmentKey } : { date: effectiveDate, periods, reason, attachmentKey });
      toast.show("Absenz gesendet. Deine Klassenlehrperson prüft sie.");
      await onSent();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Senden fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Absenz entschuldigen"
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button label={`${plural(periods.length, "Lektion", "Lektionen")} entschuldigen`} icon="send" haptic busy={busy} disabled={!periods.length} onPress={send} />
        </>
      }
    >
      {target.kind === "excuse" ? (
        <StaticField label="Datum" icon="cal" end={due ? `Frist ${fmtShortLoose(due)}` : undefined}>
          {fmtMedium(target.absence.date, true)}
        </StaticField>
      ) : days.length ? (
        <SelectField
          label="Datum"
          value={effectiveDate}
          onChange={(v) => {
            setDate(v);
            setPeriods([]);
          }}
          options={days.map((x) => ({ value: x, label: `${fmtMedium(x, true)} · Frist ${fmtShortLoose(absenceDueDate(x))}` }))}
        />
      ) : null}
      {lessons.data && lessons.data.lessons.length > 0 && (
        <View style={{ gap: sp[2] }}>
          <T v="label">Lektionen</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[2] }}>
            {lessons.data.lessons.map((l) => {
              const on = periods.includes(l.period);
              return (
                <Pressable
                  key={l.period}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${l.period}. Lektion, ${l.subjectName ?? ""}`}
                  onPress={() => setPeriods((x) => (x.includes(l.period) ? x.filter((y) => y !== l.period) : [...x, l.period].sort((a, b) => a - b)))}
                  style={{ width: "31.8%", minHeight: size.touchMin, padding: sp[4], borderRadius: radius.l, backgroundColor: on ? c.ink : c.panel, gap: 2 }}
                >
                  <T style={{ fontFamily: font.body700, fontSize: fs.m, color: on ? c.bg : c.ink }}>{l.period}. Lektion</T>
                  <T style={{ fontSize: fs.s, color: on ? c.bg : c.text2, opacity: on ? 0.75 : 1 }}>{lessonLabel(l)}</T>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
      <View style={{ gap: sp[2] }}>
        <T v="label">Grund</T>
        <Segment label="Grund" value={reason} onChange={setReason} options={ABSENCE_REASONS.map((r) => ({ value: r, label: r }))} />
      </View>
      <View style={{ gap: sp[2] }}>
        <Pressable accessibilityRole="button" accessibilityLabel={file ? `Anhang ${file.name}, ändern` : "Bestätigung anhängen"} onPress={pick} style={{ flexDirection: "row", alignItems: "center", gap: sp[5], minHeight: 50, padding: sp[6], borderRadius: radius.l, borderWidth: 1, borderStyle: "dashed", borderColor: c.ruleStrong }}>
          <Icon name="clip" />
          <T style={{ flex: 1, color: c.text2, fontSize: fs.m }}>
            <T style={{ fontFamily: font.body700, fontSize: fs.m }}>{file ? file.name : "Bestätigung anhängen"}</T>
            {file ? "" : " · ab 3 Tagen ein Arztzeugnis"}
          </T>
        </Pressable>
        {!!fileError && (
          <T v="smallStrong" tone="err">
            {fileError}
          </T>
        )}
      </View>
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}

function lastSchoolDays(today: string): string[] {
  const out: string[] = [];
  for (let i = 0; i <= 14; i++) {
    const d = addDays(today, -i);
    if (weekday(d) !== 0 && weekday(d) !== 6) out.push(d);
  }
  return out;
}
