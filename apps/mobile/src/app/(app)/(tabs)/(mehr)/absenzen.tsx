import { addDays, attachmentRequired, config, DISPENSATION_REASONS, fmtMedium, fmtShortLoose, monthShort, plural, semesterOf, weekday, type Absence, type AbsenceNotice, type Dispensation } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import { useState, type ReactNode } from "react";
import { Linking, Pressable, View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { storage } from "@/lib/storage";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, size, sp, useTheme } from "@/theme";
import { Banner, Button, Card, Empty, Icon, Kpis, SelectField, Sheet, SkBox, SkeletonArea, Status, T, TextField, TextTabs, useToast, type StatusTone } from "@/ui";

type Tab = "absenzen" | "abmeldungen" | "dispensationen";
type Reason = (typeof DISPENSATION_REASONS)[number];
type DayLesson = { period: number; subjectCode: string | null; subjectName: string | null; subjectShort: string | null };
type Editing = { kind: "notice"; notice?: AbsenceNotice } | { kind: "dispensation"; dispensation?: Dispensation } | null;

const STATUS: Record<Absence["status"], [StatusTone, string]> = {
  dispensed: ["ok", "Dispensiert"],
  contingent: ["info", "Kontingent"],
  unexcused: ["err", "Unentschuldigt"],
};

const DISP_STATUS: Record<Dispensation["status"], [StatusTone, string]> = {
  submitted: ["info", "Eingereicht"],
  approved: ["ok", "Bewilligt"],
  rejected: ["err", "Abgelehnt"],
};

const created = (stamp: string) => `Erfasst ${fmtShortLoose(stamp.slice(0, 10))} ${stamp.slice(11, 16)}`;
const periodLabel = (n: number) => {
  const p = config.periods.find((x) => x.n === n);
  return p ? `L${n} · ${p.from} bis ${p.to}` : `L${n}`;
};

/** Wie die Lektionen zählen: "2 aufs Kontingent · ohne Abmeldung doppelt". */
function countLine(lessons: Absence["lessons"]) {
  const charged = lessons.reduce((n, l) => n + (l.state === "dispensed" ? 0 : l.weight), 0);
  const dispensed = lessons.filter((l) => l.state === "dispensed").length;
  const parts: string[] = [];
  if (dispensed && dispensed < lessons.length) parts.push(`${dispensed} dispensiert`);
  if (charged) parts.push(`${charged} aufs Kontingent`);
  if (lessons.some((l) => l.state !== "dispensed" && !l.notified)) parts.push("ohne Abmeldung doppelt");
  return parts.join(" · ");
}

export default function Absences() {
  const { c: colors } = useTheme();
  const params = useLocalSearchParams<{ neu?: string }>();
  const abs = useApi(() => api.absences(), [], { cache: "absences" });
  const clock = useApi(() => api.home(), [], { cache: "home" });
  const me = useMe();
  const [tab, setTab] = useState<Tab>(params.neu === "abmeldung" ? "abmeldungen" : "absenzen");
  const [fach, setFach] = useState("");
  // Link aus der Übersicht (?neu=abmeldung) öffnet den Dialog einmal
  const [editing, setEditing] = useState<Editing>(params.neu === "abmeldung" ? { kind: "notice" } : null);
  const today = clock.data?.today ?? null;

  const d = abs.data;
  const c = d?.contingent;
  return (
    <Screen title="Absenzen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={abs.refresh} refreshing={abs.refreshing}>
      {abs.error && !d ? (
        <ErrorState message={abs.error} onRetry={abs.reload} />
      ) : !d || !c ? (
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
              { label: "Gefehlt", value: c.missed },
              { label: `Übrig von ${c.size}`, value: c.available, tone: c.available === 0 ? "err" : c.available <= 3 ? "warn" : undefined },
              { label: "Bezogen", value: c.used, tone: c.used > c.size ? "err" : undefined },
            ]}
          />
          <TextTabs
            label="Absenzen"
            lined
            value={tab}
            onChange={setTab}
            items={[
              { value: "absenzen", label: "Absenzen" },
              { value: "abmeldungen", label: "Abmeldungen" },
              { value: "dispensationen", label: "Dispensationen" },
            ]}
          />
          <Button
            label={tab === "dispensationen" ? "Neues Gesuch" : "Neue Abmeldung"}
            icon="plus"
            wide
            disabled={!today}
            onPress={() => setEditing(tab === "dispensationen" ? { kind: "dispensation" } : { kind: "notice" })}
            style={{ marginVertical: sp[5] }}
          />
          {tab !== "absenzen" && !config.absenceSystem.connected && (
            <Banner action={config.services.absenzendatenbank ? <Button label="Absenzendatenbank öffnen" variant="line" small onPress={() => Linking.openURL(config.services.absenzendatenbank!)} /> : undefined}>
              <T v="strong" style={{ color: colors.warn }}>
                Nur im Portal gespeichert.
              </T>{" "}
              Die Schule sieht {tab === "abmeldungen" ? "Abmeldungen" : "Gesuche"} nur in der Absenzendatenbank, trage sie dort ein.
            </Banner>
          )}
          {tab === "absenzen" && <AbsenceList items={d.items} subjects={d.subjects} fach={fach} setFach={setFach} />}
          {tab === "abmeldungen" &&
            (d.notices.length === 0 ? (
              <Empty icon="check" title="Keine Abmeldungen." />
            ) : (
              <Card>
                {d.notices.map((n, i) => (
                  <Row
                    key={n.id}
                    i={i}
                    date={n.date}
                    title={`${n.from} bis ${n.to}`}
                    sub={[n.fromPeriod === n.toPeriod ? `L${n.fromPeriod}` : `L${n.fromPeriod} bis L${n.toPeriod}`, n.note, created(n.createdAt)].filter(Boolean).join(" · ")}
                    onPress={n.editable ? () => setEditing({ kind: "notice", notice: n }) : undefined}
                    a11y={`Abmeldung ${fmtMedium(n.date, true)}, ${n.from} bis ${n.to}`}
                  />
                ))}
              </Card>
            ))}
          {tab === "dispensationen" &&
            (d.dispensations.length === 0 ? (
              <Empty icon="check" title="Keine Dispensationsgesuche." />
            ) : (
              <Card>
                {d.dispensations.map((x, i) => {
                  const [tone, label] = DISP_STATUS[x.status];
                  const subjects = [...new Set(x.lessons.map((l) => l.subjectName).filter(Boolean))].join(", ");
                  return (
                    <Row
                      key={x.id}
                      i={i}
                      date={x.date}
                      title={x.reason}
                      sub={[`${plural(x.lessons.length, "Lektion", "Lektionen")}${subjects ? ` · ${subjects}` : ""}`, x.note, x.attachments ? plural(x.attachments, "Anhang", "Anhänge") : null, x.late ? "Verspätet" : null, created(x.createdAt)].filter(Boolean).join(" · ")}
                      status={<Status tone={tone} label={label} />}
                      onPress={x.editable ? () => setEditing({ kind: "dispensation", dispensation: x }) : undefined}
                      a11y={`Gesuch ${fmtMedium(x.date, true)}, ${x.reason}, ${label}`}
                    />
                  );
                })}
              </Card>
            ))}
        </>
      )}
      {editing && today && (
        <EditSheet
          editing={editing}
          today={today}
          onClose={() => setEditing(null)}
          onDone={async () => {
            setEditing(null);
            await Promise.all([abs.refresh(), me.refresh()]);
          }}
        />
      )}
    </Screen>
  );
}

function Row({ i, date, title, sub, status, onPress, a11y }: { i: number; date: string; title: string; sub: string; status?: ReactNode; onPress?: () => void; a11y: string }) {
  const { c } = useTheme();
  const body = (
    <View style={{ flexDirection: "row", gap: sp[5], alignItems: "flex-start", paddingTop: i ? sp[6] : 0, paddingBottom: sp[6], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
      <View style={{ width: 46, alignItems: "center", paddingVertical: sp[2], borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule }}>
        <T style={{ fontFamily: font.display400, fontSize: fs.h3, lineHeight: 20 }}>{date.slice(8)}</T>
        <T style={{ fontFamily: font.body700, fontSize: fs.micro, color: c.text2 }}>{monthShort(date).replace(".", "").toUpperCase()}</T>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="strong" style={{ fontFamily: font.body700 }}>
          {title}
        </T>
        {!!sub && <T v="small">{sub}</T>}
        {status && <View style={{ marginTop: sp[1] }}>{status}</View>}
      </View>
      {onPress && <Icon name="edit" small color={c.text2} />}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}. Bearbeiten`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {body}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={a11y}>
      {body}
    </View>
  );
}

function AbsenceList({ items, subjects, fach, setFach }: { items: Absence[]; subjects: { subjectCode: string; subjectName: string; used: number; max: number }[]; fach: string; setFach: (v: string) => void }) {
  if (items.length === 0) return <Empty icon="check" title="Keine Absenzen." />;
  const names = new Map<string, string>();
  for (const x of items) for (const l of x.lessons) if (l.subjectCode && l.subjectName) names.set(l.subjectCode, l.subjectName);
  const shown = fach ? items.filter((x) => x.lessons.some((l) => l.subjectCode === fach)) : items;
  const limit = fach ? subjects.find((s) => s.subjectCode === fach) : undefined;
  return (
    <>
      {names.size > 1 && (
        <View style={{ marginBottom: sp[5] }}>
          <TextTabs label="Fach" value={fach} onChange={setFach} items={[{ value: "", label: "Alle Fächer" }, ...[...names].map(([value, label]) => ({ value, label }))]} />
        </View>
      )}
      {limit && limit.max > 0 && (
        <Kpis
          items={[
            { label: `${limit.subjectName} auf Kontingent`, value: limit.used, tone: limit.used > limit.max ? "err" : limit.used === limit.max ? "warn" : undefined },
            { label: "Höchstens im Semester", value: limit.max },
          ]}
        />
      )}
      {shown.length === 0 ? (
        <Empty icon="check" title="Keine Absenzen in diesem Fach." />
      ) : (
        <Card>
          {shown.map((x, i) => {
            const lessons = fach ? x.lessons.filter((l) => l.subjectCode === fach) : x.lessons;
            const status = lessons.some((l) => l.state === "unexcused") ? "unexcused" : lessons.some((l) => l.state === "contingent") ? "contingent" : "dispensed";
            const [tone, label] = STATUS[status];
            const teachers = [...new Set(lessons.map((l) => l.teacher).filter(Boolean))].join(", ");
            const title = `${plural(lessons.length, "Lektion", "Lektionen")} · ${fach ? (lessons[0]?.subjectName ?? x.subjectsLabel) : x.subjectsLabel}`;
            return <Row key={x.id} i={i} date={x.date} title={title} sub={[teachers, countLine(lessons)].filter(Boolean).join(" · ")} status={<Status tone={tone} label={label} />} a11y={`${fmtMedium(x.date, true)}, ${title}, ${label}`} />;
          })}
        </Card>
      )}
    </>
  );
}

/** Schultage (Montag bis Freitag) von `from` bis `to`, neuste zuletzt. */
function schoolDays(from: string, to: string, keep?: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) if (weekday(d) !== 0 && weekday(d) !== 6) out.push(d);
  if (keep && !out.includes(keep)) out.push(keep);
  return out.sort();
}

function EditSheet({ editing, today, onClose, onDone }: { editing: Exclude<Editing, null>; today: string; onClose: () => void; onDone: () => Promise<void> }) {
  return editing.kind === "notice" ? <NoticeSheet notice={editing.notice} today={today} onClose={onClose} onDone={onDone} /> : <DispensationSheet dis={editing.dispensation} today={today} onClose={onClose} onDone={onDone} />;
}

const message = (e: unknown) => (e instanceof ApiFailure ? e.message : "Senden fehlgeschlagen. Versuche es nochmals.");

/** Löschen mit Bestätigung im selben Sheet. */
function DeleteButton({ what, onDelete }: { what: string; onDelete: () => Promise<void> }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  return ask ? (
    <Button
      label={`${what} wirklich löschen`}
      variant="line"
      icon="trash"
      busy={busy}
      onPress={async () => {
        setBusy(true);
        try {
          await onDelete();
        } finally {
          setBusy(false);
        }
      }}
    />
  ) : (
    <Button label="Löschen" variant="ghost" icon="trash" onPress={() => setAsk(true)} />
  );
}

function NoticeSheet({ notice, today, onClose, onDone }: { notice?: AbsenceNotice; today: string; onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [date, setDate] = useState(notice?.date ?? today);
  const [from, setFrom] = useState(notice?.fromPeriod ?? 1);
  const [to, setTo] = useState(notice?.toPeriod ?? config.periods.at(-1)!.n);
  const [note, setNote] = useState(notice?.note ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const days = schoolDays(notice ? today : addDays(today, -14), addDays(today, 56), date);

  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = { date, fromPeriod: from, toPeriod: to, note: note || undefined };
      if (notice) await api.updateAbsenceNotice(notice.id, body);
      else await api.submitAbsenceNotice(body);
      toast.show(notice ? "Abmeldung geändert." : "Abmeldung gespeichert.");
      await onDone();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={notice ? "Abmeldung bearbeiten" : "Abmeldung eintragen"}
      actions={
        <>
          {notice ? (
            <DeleteButton
              what="Abmeldung"
              onDelete={async () => {
                try {
                  await api.deleteAbsenceNotice(notice.id);
                  toast.show("Abmeldung gelöscht.");
                  await onDone();
                } catch (e) {
                  setError(message(e));
                }
              }}
            />
          ) : (
            <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          )}
          <Button label="Abmeldung speichern" icon="check" haptic busy={busy} onPress={save} />
        </>
      }
    >
      <SelectField label="Datum" value={date} onChange={setDate} options={days.map((x) => ({ value: x, label: fmtMedium(x, true) }))} />
      <SelectField
        label="Von"
        value={String(from)}
        onChange={(v) => {
          const n = Number(v);
          setFrom(n);
          if (to < n) setTo(n);
        }}
        options={config.periods.map((p) => ({ value: String(p.n), label: periodLabel(p.n) }))}
      />
      <SelectField label="Bis" value={String(to)} onChange={(v) => setTo(Number(v))} options={config.periods.filter((p) => p.n >= from).map((p) => ({ value: String(p.n), label: periodLabel(p.n) }))} />
      <TextField label="Bemerkung" value={note} onChangeText={setNote} maxLength={500} multiline />
      {!!error && (
        <T v="smallStrong" tone="err" accessibilityRole="alert">
          {error}
        </T>
      )}
    </Sheet>
  );
}

async function upload(file: DocumentPicker.DocumentPickerAsset): Promise<string> {
  const fd = new FormData();
  if (file.file) fd.append("file", file.file);
  else fd.append("file", { uri: file.uri, name: file.name, type: file.mimeType ?? "application/octet-stream" } as unknown as Blob);
  const token = await storage.get("session");
  const res = await fetch(`${API_URL}/api/v1/absences/attachment`, { method: "POST", body: fd, headers: token ? { authorization: `Bearer ${token}` } : {} });
  const body = (await res.json().catch(() => null)) as { key?: string; error?: { message: string } } | null;
  if (!res.ok || !body?.key) throw new Error(body?.error?.message ?? "Hochladen fehlgeschlagen.");
  return body.key;
}

function DispensationSheet({ dis, today, onClose, onDone }: { dis?: Dispensation; today: string; onClose: () => void; onDone: () => Promise<void> }) {
  const { c } = useTheme();
  const toast = useToast();
  const [date, setDate] = useState(dis?.date ?? today);
  const [reason, setReason] = useState<Reason>((dis?.reason as Reason) ?? DISPENSATION_REASONS[0]);
  const [note, setNote] = useState(dis?.note ?? "");
  const [kept, setKept] = useState(dis?.attachments ?? 0);
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [fileError, setFileError] = useState("");
  const [periods, setPeriods] = useState<number[]>(dis?.lessons.map((l) => l.period) ?? []);
  const [special, setSpecial] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lessons = useApi(() => api.absenceLessons(date), [date]);
  const dayLessons = lessons.data?.lessons ?? null;
  const days = schoolDays(semesterOf(today).from, addDays(today, 56), date);

  const outside = dayLessons !== null && periods.some((p) => !dayLessons.some((l) => l.period === p));
  const all = special || outside || (dayLessons !== null && dayLessons.length === 0);
  const choices: DayLesson[] = all ? config.periods.map((p) => dayLessons?.find((l) => l.period === p.n) ?? { period: p.n, subjectCode: null, subjectName: null, subjectShort: null }) : (dayLessons ?? []);
  const slots = 2 - kept;

  async function pick() {
    setFileError("");
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png"], copyToCacheDirectory: true });
    if (r.canceled) return;
    const f = r.assets[0]!;
    if (f.size && f.size > 5 * 1024 * 1024) return setFileError("Die Datei ist grösser als 5 MB.");
    setFiles((x) => [...x, f].slice(0, slots));
  }

  async function save() {
    if (!periods.length) return;
    if (attachmentRequired(reason) && kept + files.length === 0) return setFileError("Hänge eine Bestätigung an.");
    setBusy(true);
    setError("");
    try {
      const attachmentKeys: string[] = [];
      for (const f of files.slice(0, slots)) {
        try {
          attachmentKeys.push(await upload(f));
        } catch (e) {
          setFileError((e as Error).message);
          return;
        }
      }
      const body = { date, reason, note: note || undefined, periods, attachmentKeys, keepAttachments: kept > 0 };
      if (dis) await api.updateDispensation(dis.id, body);
      else await api.submitDispensation(body);
      toast.show(dis ? "Gesuch geändert." : "Gesuch eingereicht.");
      await onDone();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={dis ? "Gesuch bearbeiten" : "Dispensationsgesuch einreichen"}
      actions={
        <>
          {dis ? (
            <DeleteButton
              what="Gesuch"
              onDelete={async () => {
                try {
                  await api.deleteDispensation(dis.id);
                  toast.show("Gesuch gelöscht.");
                  await onDone();
                } catch (e) {
                  setError(message(e));
                }
              }}
            />
          ) : (
            <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          )}
          <Button label={dis ? "Gesuch speichern" : periods.length ? `${plural(periods.length, "Lektion", "Lektionen")} beantragen` : "Gesuch einreichen"} icon="send" haptic busy={busy} disabled={!periods.length} onPress={save} />
        </>
      }
    >
      <SelectField
        label="Datum"
        value={date}
        onChange={(v) => {
          setDate(v);
          setPeriods([]);
        }}
        options={days.map((x) => ({ value: x, label: fmtMedium(x, true) }))}
      />
      <SelectField label="Grund" value={reason} onChange={setReason} options={DISPENSATION_REASONS.map((r) => ({ value: r, label: r }))} />
      <TextField label="Bemerkung" value={note} onChangeText={setNote} maxLength={500} multiline />

      <View style={{ gap: sp[2] }}>
        <T v="label">Anhang</T>
        {kept > 0 && (
          <Attachment label={`${plural(kept, "Anhang", "Anhänge")} gespeichert`} onRemove={() => setKept(0)} removeLabel="Gespeicherte Anhänge entfernen" />
        )}
        {files.map((f, i) => (
          <Attachment key={f.uri} label={f.name} onRemove={() => setFiles((x) => x.filter((_, j) => j !== i))} removeLabel={`Anhang ${f.name} entfernen`} />
        ))}
        {kept + files.length < 2 && (
          <Pressable accessibilityRole="button" accessibilityLabel={`Anhang ${kept + files.length + 1} hochladen`} onPress={pick} style={{ flexDirection: "row", alignItems: "center", gap: sp[5], minHeight: 50, padding: sp[6], borderRadius: radius.l, borderWidth: 1, borderStyle: "dashed", borderColor: c.ruleStrong }}>
            <Icon name="clip" />
            <T style={{ flex: 1, fontFamily: font.body700, fontSize: fs.m }}>{`Anhang ${kept + files.length + 1} hochladen`}</T>
          </Pressable>
        )}
        {!!fileError && (
          <T v="smallStrong" tone="err" accessibilityRole="alert">
            {fileError}
          </T>
        )}
      </View>

      <View style={{ gap: sp[2] }}>
        <T v="label">Zu dispensierende Lektionen</T>
        {dayLessons === null ? (
          <T v="small">Lektionen werden geladen.</T>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[2] }}>
            {choices.map((l) => {
              const on = periods.includes(l.period);
              return (
                <Pressable
                  key={l.period}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`L${l.period}, ${l.subjectName ?? config.periods.find((p) => p.n === l.period)?.from ?? ""}`}
                  onPress={() => setPeriods((x) => (x.includes(l.period) ? x.filter((y) => y !== l.period) : [...x, l.period].sort((a, b) => a - b)))}
                  style={{ width: "31.8%", minHeight: size.touchMin, padding: sp[4], borderRadius: radius.l, backgroundColor: on ? c.ink : c.panel, gap: 2 }}
                >
                  <T style={{ fontFamily: font.body700, fontSize: fs.m, color: on ? c.bg : c.ink }}>L{l.period}</T>
                  <T style={{ fontSize: fs.s, color: on ? c.bg : c.text2, opacity: on ? 0.75 : 1 }}>{l.subjectShort ?? config.periods.find((p) => p.n === l.period)?.from ?? ""}</T>
                </Pressable>
              );
            })}
          </View>
        )}
        {dayLessons !== null && dayLessons.length > 0 && !outside && (
          <View style={{ alignSelf: "flex-start" }}>
            <Button label="Sonderstundenplan" variant={special ? "ink" : "ghost"} small accessibilityState={{ selected: special }} onPress={() => setSpecial((x) => !x)} />
          </View>
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

function Attachment({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: sp[5], minHeight: 50, paddingHorizontal: sp[6], borderRadius: radius.l, borderWidth: 1, borderColor: c.rule }}>
      <Icon name="clip" />
      <T style={{ flex: 1, fontFamily: font.body700, fontSize: fs.m }} numberOfLines={1}>
        {label}
      </T>
      <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} onPress={onRemove} hitSlop={12} style={{ minWidth: size.touchMin, minHeight: size.touchMin, alignItems: "center", justifyContent: "center" }}>
        <Icon name="x" small />
      </Pressable>
    </View>
  );
}
