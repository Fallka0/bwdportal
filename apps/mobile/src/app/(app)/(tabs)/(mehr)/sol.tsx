import { config, fileTypeLabel, fmtBytes, fmtLong, fromMin, SOL_STATUS_LABEL, solColumns, toMin, WEEKDAYS, weekday, type SolStatus, type SolTasks } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { storage } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, size, sp, useTheme } from "@/theme";
import { TimeGrid } from "@/timegrid/TimeGrid";
import { Button, Card, Empty, Icon, IconButton, Segment, SelectField, Sheet, SkBox, SkeletonArea, StaticField, T, TextField, TextTabs, useToast } from "@/ui";

type Tab = "auftraege" | "kalender" | "portfolio";

export default function Sol() {
  const [tab, setTab] = useState<Tab>("auftraege");
  // Die App zeigt den aktuellen Block (wie im Design); Blockwahl gibt es im Web.
  const tasks = useApi(() => api.solTasks(), [], { cache: "solTasks" });
  return (
    <Screen title="SOL" back={{ label: "Mehr", href: "/mehr" }} onRefresh={tasks.refresh} refreshing={tasks.refreshing}>
      <TextTabs<Tab>
        label="SOL"
        lined
        value={tab}
        onChange={setTab}
        items={[
          { value: "auftraege", label: "Aufträge" },
          { value: "kalender", label: "Kalender" },
          { value: "portfolio", label: "Portfolio" },
        ]}
      />
      {tasks.error && !tasks.data ? (
        <ErrorState message={tasks.error} onRetry={tasks.reload} />
      ) : !tasks.data ? (
        <SkeletonArea label="SOL wird geladen">
          <SkBox h={420} />
        </SkeletonArea>
      ) : tab === "auftraege" ? (
        <Tasks data={tasks.data} reload={tasks.refresh} />
      ) : tab === "kalender" ? (
        <Calendar tasks={tasks.data} />
      ) : (
        <Portfolio />
      )}
    </Screen>
  );
}

/** Datei im Browser öffnen. `path` ist eine API-Adresse (/api/v1/files/…); Links können keinen Header senden, darum ?t=. */
async function openFile(path: string, query = "") {
  const t = await storage.get("session");
  const params = [query, t ? `t=${encodeURIComponent(t)}` : ""].filter(Boolean).join("&");
  const url = path.startsWith("/") ? `${API_URL}${path}` : `${API_URL}/api/v1/files/${path}`;
  Linking.openURL(`${url}${params ? `?${params}` : ""}`);
}

type Task = SolTasks["groups"][number]["tasks"][number];

function Tasks({ data, reload }: { data: SolTasks; reload: () => Promise<void> }) {
  const { c } = useTheme();
  const [fach, setFach] = useState("alle");
  const [open, setOpen] = useState<{ task: Task; title: string } | null>(null);
  if (!data.block || data.groups.length === 0) return <Empty icon="book" title={data.block ? `Keine Aufträge in Block ${data.block.n}.` : "Keine SOL-Blöcke."} />;
  const groups = data.groups.filter((g) => fach === "alle" || g.subject.code === fach);
  return (
    <>
      <TextTabs label="Fach" value={fach} onChange={setFach} items={[{ value: "alle", label: "Alle" }, ...data.groups.map((g) => ({ value: g.subject.code, label: g.subject.short }))]} />
      {groups.map((g) => (
        <View key={g.subject.code} style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: sp[5], marginBottom: sp[3] }}>
            <T accessibilityRole="header" style={{ fontFamily: font.display400, fontSize: fs.h3, letterSpacing: -0.5 }}>
              {g.subject.name}
            </T>
            {g.teacher && <T v="small">{g.teacher}</T>}
            <T v="small" style={{ marginLeft: "auto" }}>
              {g.tasks.filter((t) => t.status === "done").length} von {g.tasks.length} erledigt
            </T>
          </View>
          <Card pad={sp[7]} style={{ paddingVertical: sp[1] }}>
            {g.tasks.map((t, i) => {
              const done = t.status === "done";
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.code} ${t.title}, ${t.minutes} Minuten, ${SOL_STATUS_LABEL[t.status]}`}
                  onPress={() => setOpen({ task: t, title: `${g.subject.short} ${t.code} ${t.title}` })}
                  style={{ flexDirection: "row", alignItems: "center", gap: sp[5], minHeight: size.touchMin, paddingVertical: sp[4], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}
                >
                  <T style={{ fontFamily: font.body600, fontSize: fs.m, color: c.text2, width: 30 }}>{t.code}</T>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T numberOfLines={1} style={{ fontFamily: done ? font.body600 : font.body700, fontSize: fs.base, color: done ? c.text2 : c.ink }}>
                      {t.title}
                    </T>
                    <T v="small">
                      {t.minutes} Min. · {SOL_STATUS_LABEL[t.status]}
                    </T>
                  </View>
                  <Icon name="chev-r" small color={c.text2} />
                </Pressable>
              );
            })}
          </Card>
        </View>
      ))}
      {open && <TaskSheet task={open.task} title={open.title} onClose={() => setOpen(null)} onSaved={reload} />}
    </>
  );
}

/** Auftrag: Stand setzen, als PDF oder Word öffnen, in SharePoint öffnen. */
function TaskSheet({ task, title, onClose, onSaved }: { task: Task; title: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [v, setV] = useState<SolStatus>(task.status);
  async function set(next: SolStatus) {
    const before = v;
    setV(next);
    try {
      await api.setSolStatus(task.id, next);
      await onSaved();
    } catch {
      setV(before);
      toast.show("Speichern fehlgeschlagen. Versuche es nochmals.");
    }
  }
  return (
    <Sheet open onClose={onClose} title="Auftrag" actions={<Button label="Fertig" onPress={onClose} />}>
      <T v="strong">{title}</T>
      <T v="small">{task.minutes} Min.</T>
      <Segment label="Stand" value={v} onChange={set} options={(["open", "started", "done"] as const).map((s) => ({ value: s, label: SOL_STATUS_LABEL[s] }))} />
      {([
        ["task", "Auftrag"],
        ["material", "Unterlagen"],
        ["solution", "Lösungen"],
      ] as const).map(([kind, label]) => {
        const list = task.files.filter((f) => f.kind === kind);
        if (!list.length) return null;
        return (
          <View key={kind} style={{ gap: sp[2] }}>
            <T v="label">{label}</T>
            {list.map((f) => (
              <View key={f.id} style={{ flexDirection: "row", alignItems: "center", gap: sp[2], minHeight: size.touchMin }}>
                <View style={{ flex: 1 }}>
                  <T numberOfLines={2}>{f.name}</T>
                  {f.bytes > 0 && <T v="small">{fmtBytes(f.bytes)}</T>}
                </View>
                {f.pdfHref && <Button label="PDF" variant="line" small onPress={() => openFile(f.href, "format=pdf")} />}
                <Button label={fileTypeLabel(f.ext)} variant="line" small onPress={() => openFile(f.href)} />
              </View>
            ))}
          </View>
        );
      })}
      {task.sharepointUrl && <Button label="In SharePoint öffnen" variant="line" icon="arrow-ur" wide onPress={() => Linking.openURL(task.sharepointUrl!)} />}
    </Sheet>
  );
}

function Calendar({ tasks }: { tasks: SolTasks }) {
  const [dayId, setDayId] = useState<string | undefined>(undefined);
  const cal = useApi(() => api.solCalendar(dayId), [dayId], { cache: "solCalendar" });
  const clock = useApi(() => api.home(), [], { cache: "home" });
  const [open, setOpen] = useState(false);
  if (cal.error && !cal.data) return <ErrorState message={cal.error} onRetry={cal.reload} />;
  if (!cal.data || !clock.data)
    return (
      <SkeletonArea label="Kalender wird geladen">
        <SkBox h={620} />
      </SkeletonArea>
    );
  const { day, days, plan, presence } = cal.data;
  if (!day) return <Empty icon="cal" title="Keine SOL-Tage." />;
  const i = days.findIndex((d) => d.id === day.id);
  const isToday = day.date === clock.data.today;
  return (
    <>
      <TimeGrid
        variant="sol"
        grid={{ end: config.timeGridEnd, columns: solColumns(day.date, plan, presence), lunch: config.solLunch }}
        now={{ date: clock.data.today, time: clock.data.now }}
        live={false}
        title={isToday ? "Heute" : fmtLong(day.date)}
        sub={isToday ? `${fmtLong(day.date)} · Block ${day.blockN}` : `Block ${day.blockN}`}
        prev={days[i - 1] ? { onPress: () => setDayId(days[i - 1]!.id), label: "Vorheriger SOL-Tag" } : undefined}
        next={days[i + 1] ? { onPress: () => setDayId(days[i + 1]!.id), label: "Nächster SOL-Tag" } : undefined}
      />
      <Button label="Einplanen" icon="plus" wide onPress={() => setOpen(true)} style={{ marginTop: sp[5] }} />
      {open && <PlanSheet day={day} plan={plan} tasks={tasks} onClose={() => setOpen(false)} onSaved={cal.refresh} />}
    </>
  );
}

function PlanSheet({ day, plan, tasks, onClose, onSaved }: { day: { id: string; date: string }; plan: { taskId: string; subjectCode: string; start: string; end: string }[]; tasks: SolTasks; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const planned = new Set(plan.map((p) => p.taskId));
  const load = (code: string) => plan.filter((p) => p.subjectCode === code).reduce((m, p) => m + toMin(p.end) - toMin(p.start), 0);
  const options = tasks.groups
    .flatMap((g) => g.tasks.filter((t) => t.status !== "done" && !planned.has(t.id)).map((t) => ({ value: t.id, label: `${g.subject.name} ${t.code} · ${t.minutes} Min.`, name: `${g.subject.name} ${t.code}`, load: load(g.subject.code) })))
    .sort((a, b) => a.load - b.load);
  const lastEnd = plan.reduce((m, p) => (p.end > m ? p.end : m), "08:00");
  const start = fromMin(Math.min(Math.ceil((toMin(lastEnd) + 5) / 5) * 5, 16 * 60 + 30));
  const [taskId, setTaskId] = useState(options[0]?.value ?? "");
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(fromMin(Math.min(toMin(start) + 30, 17 * 60)));
  const [errs, setErrs] = useState<{ from?: string; to?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const valid = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

  async function save() {
    const next: typeof errs = {};
    if (!valid(from)) next.from = "Zeit als HH:MM eingeben.";
    if (!valid(to)) next.to = "Zeit als HH:MM eingeben.";
    if (!next.from && !next.to && toMin(to) <= toMin(from)) next.to = "Bis muss nach Von liegen.";
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.addSolPlan({ solDayId: day.id, taskId, start: from, end: to });
      toast.show(`${options.find((o) => o.value === taskId)?.name ?? "Auftrag"} eingeplant, ${WEEKDAYS[weekday(day.date)]} ${from}.`);
      await onSaved();
      onClose();
    } catch (e) {
      const f = e instanceof ApiFailure ? e : null;
      setErrs(f?.field === "start" ? { from: f.message } : { form: f?.message ?? "Speichern fehlgeschlagen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Einplanen"
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button label="Einplanen" haptic busy={busy} disabled={!taskId} onPress={save} />
        </>
      }
    >
      {options.length === 0 ? (
        <T tone="text2">Alle Aufträge dieses Blocks sind erledigt oder eingeplant.</T>
      ) : (
        <>
          <SelectField label="Auftrag" value={taskId} onChange={setTaskId} options={options} />
          <StaticField label="SOL-Tag" icon="cal">
            {fmtLong(day.date)}
          </StaticField>
          <View style={{ flexDirection: "row", gap: sp[4] }}>
            <View style={{ flex: 1 }}>
              <TextField label="Von" value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" error={errs.from} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Bis" value={to} onChangeText={setTo} keyboardType="numbers-and-punctuation" error={errs.to} />
            </View>
          </View>
          {!!errs.form && (
            <T v="smallStrong" tone="err">
              {errs.form}
            </T>
          )}
        </>
      )}
    </Sheet>
  );
}

function Portfolio() {
  const { c } = useTheme();
  const pf = useApi(() => api.solPortfolio(), [], { cache: "solPortfolio" });
  const [edit, setEdit] = useState<{ solDayId: string; date: string; checkIn: string; checkOut: string } | null>(null);
  if (pf.error && !pf.data) return <ErrorState message={pf.error} onRetry={pf.reload} />;
  if (!pf.data)
    return (
      <SkeletonArea label="Portfolio wird geladen">
        <SkBox h={360} />
      </SkeletonArea>
    );
  const next = pf.data.next;
  return (
    <>
      {next && <Button label={`Eintrag für ${WEEKDAYS[weekday(next.date)]}`} icon="plus" wide style={{ marginBottom: sp[5] }} onPress={() => setEdit({ solDayId: next.solDayId, date: next.date, checkIn: next.checkIn ?? "", checkOut: next.checkOut ?? "" })} />}
      {pf.data.entries.length === 0 && <Empty icon="note" title="Noch keine Einträge im Portfolio." />}
      <View style={{ gap: sp[5] }}>
        {pf.data.entries.map((e) => (
          <Card key={e.solDayId}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <T v="box" accessibilityRole="header">
                {fmtLong(e.date)}
              </T>
              <IconButton icon="edit" label={`Eintrag vom ${fmtLong(e.date)} bearbeiten`} onPress={() => setEdit({ solDayId: e.solDayId, date: e.date, checkIn: e.checkIn ?? "", checkOut: e.checkOut ?? "" })} />
            </View>
            <T v="smallStrong" style={{ color: c.text2, marginTop: sp[3], marginBottom: sp[1] }}>
              Check-in
            </T>
            <T style={{ lineHeight: 22 }}>{e.checkIn ?? "–"}</T>
            {e.checkOut && (
              <>
                <T v="smallStrong" style={{ color: c.text2, marginTop: sp[6], marginBottom: sp[1] }}>
                  Check-out
                </T>
                <T style={{ lineHeight: 22 }}>{e.checkOut}</T>
              </>
            )}
          </Card>
        ))}
      </View>
      {edit && <PortfolioSheet entry={edit} onClose={() => setEdit(null)} onSaved={pf.refresh} />}
    </>
  );
}

function PortfolioSheet({ entry, onClose, onSaved }: { entry: { solDayId: string; date: string; checkIn: string; checkOut: string }; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [ci, setCi] = useState(entry.checkIn);
  const [co, setCo] = useState(entry.checkOut);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Sheet
      open
      onClose={onClose}
      title={fmtLong(entry.date)}
      actions={
        <>
          <Button label="Abbrechen" variant="ghost" onPress={onClose} />
          <Button
            label="Speichern"
            haptic
            busy={busy}
            onPress={async () => {
              if (!ci.trim() && !co.trim()) return setError("Schreib einen Check-in oder Check-out.");
              setBusy(true);
              try {
                await api.putSolPortfolio(entry.solDayId, ci, co);
                toast.show("Portfolio gespeichert.");
                await onSaved();
                onClose();
              } catch {
                setError("Speichern fehlgeschlagen. Versuche es nochmals.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      }
    >
      <TextField label="Check-in" multiline value={ci} onChangeText={setCi} placeholder="Was nimmst du dir heute vor?" maxLength={2000} />
      <TextField label="Check-out" multiline value={co} onChangeText={setCo} placeholder="Was hast du erreicht?" maxLength={2000} error={error || undefined} />
    </Sheet>
  );
}


