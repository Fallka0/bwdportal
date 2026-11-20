import { fmtGrade, isInsufficient, plural, STATUS_LABEL, type EfzModule, type PortfolioSubjectRow } from "@bwd/shared";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { EfzSheet, GradeSheet, ImportSheet } from "@/grades/GradeSheets";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, radius, sp, useTheme } from "@/theme";
import { Button, Card, Empty, Grade, Icon, Kpis, SelectField, SkBox, SkeletonArea, Status, T, TextTabs, type StatusTone } from "@/ui";

const TONE: Record<"ok" | "risk" | "fail", StatusTone> = { ok: "ok", risk: "warn", fail: "err" };
type Tab = "semester" | "efz";

export default function Grades() {
  const [sem, setSem] = useState<number | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("semester");
  const [sheet, setSheet] = useState<"new" | "import" | null>(null);
  const g = useApi(() => api.grades(sem), [sem], { cache: "grades" });
  const d = g.data;
  const done = async () => {
    setSheet(null);
    await g.refresh();
  };
  const semesters = d ? (d.semesters.some((x) => x.n === d.n) ? d.semesters : [{ n: d.n, label: d.label, count: 0 }, ...d.semesters]) : [];
  return (
    <Screen title="Noten" onRefresh={g.refresh} refreshing={g.refreshing}>
      <TextTabs<Tab>
        label="Ansicht"
        lined
        value={tab}
        onChange={setTab}
        items={[
          { value: "semester", label: "Semester" },
          { value: "efz", label: "EFZ" },
        ]}
      />
      <View style={{ gap: sp[3], marginVertical: sp[5] }}>
        {tab === "semester" && d && <SelectField label="Semester" value={String(d.n)} onChange={(v) => setSem(Number(v))} options={semesters.map((x) => ({ value: String(x.n), label: `${x.n}. Semester · ${x.label}` }))} />}
        <View style={{ flexDirection: "row", gap: sp[3] }}>
          <View style={{ flex: 1 }}>
            <Button label="Neue Note" icon="plus" wide disabled={!d} onPress={() => setSheet("new")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="Importieren" icon="upload" variant="line" wide onPress={() => setSheet("import")} />
          </View>
        </View>
      </View>
      {tab === "efz" ? (
        <Efz />
      ) : g.error && !d ? (
        <ErrorState message={g.error} onRetry={g.reload} />
      ) : !d || g.loading ? (
        <SkeletonArea label="Noten werden geladen">
          <View style={{ gap: sp[3] }}>
            <SkBox h={72} r={radius.l} />
            <SkBox h={520} />
          </View>
        </SkeletonArea>
      ) : d.count === 0 ? (
        <Empty icon="chart" title={`Noch keine Noten im ${d.n}. Semester.`} />
      ) : (
        <>
          <Kpis
            items={[
              { label: "BM-Schnitt", value: d.summary.bm !== null ? fmtGrade(d.summary.bm) : "–", tone: d.summary.bmStatus === "fail" ? "err" : d.summary.bmStatus === "risk" ? "warn" : undefined },
              { label: "EFZ", value: d.summary.efz !== null ? fmtGrade(d.summary.efz) : "–" },
              { label: "Ungenügend", value: d.summary.insufficient, tone: d.summary.insufficient ? "err" : undefined },
            ]}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[5], marginBottom: sp[5] }}>
            {d.summary.bmStatus && <Status tone={TONE[d.summary.bmStatus]} label={STATUS_LABEL.bm[d.summary.bmStatus]} />}
            {d.summary.efzStatus && <Status tone={TONE[d.summary.efzStatus]} label={STATUS_LABEL.efz[d.summary.efzStatus]} />}
            {d.summary.internship && <Status tone={TONE[d.summary.internship]} label={STATUS_LABEL.internship[d.summary.internship]} />}
          </View>
          {d.subjects.length > 0 && (
            <Card pad={sp[7]}>
              {d.subjects.map((s, i) => (
                <Row key={s.code} s={s} first={i === 0} short={s.code} onPress={() => router.push(`/noten/${s.code}?semester=${d.n}`)} />
              ))}
            </Card>
          )}
          {d.modules.length > 0 && (
            <Card pad={sp[7]} style={{ marginTop: sp[6] }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: sp[3] }}>
                <T v="box" accessibilityRole="header">
                  Informatik (gibb)
                </T>
                <T v="strong">{d.informatics ? d.informatics.raw.toFixed(2) : "–"}</T>
              </View>
              {d.modules.map((m, i) => (
                <Row key={m.module} s={m} first={i === 0} short="IN" onPress={() => router.push(`/noten/IN?semester=${d.n}&modul=${m.module}`)} />
              ))}
            </Card>
          )}
        </>
      )}
      {sheet === "new" && d && <GradeSheet semester={d.n} onClose={() => setSheet(null)} onDone={done} />}
      {sheet === "import" && <ImportSheet onClose={() => setSheet(null)} onDone={done} />}
    </Screen>
  );
}

function Row({ s, first, short, onPress }: { s: PortfolioSubjectRow; first: boolean; short: string; onPress: () => void }) {
  const { c } = useTheme();
  const low = s.grade !== null && isInsufficient(s.grade);
  const title = s.module ? `${s.module} ${s.moduleName ?? ""}`.trim() : s.name;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title}, Note ${s.grade !== null ? fmtGrade(s.grade) : "keine"}, ${plural(s.count, "Probe", "Proben")}`}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[5], paddingVertical: sp[5], borderTopWidth: first ? 0 : 1, borderTopColor: c.rule, opacity: pressed ? 0.6 : 1 })}
    >
      <View style={{ width: 40, height: 40, borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: low ? 1.5 : 1, borderColor: low ? c.err : c.rule, alignItems: "center", justifyContent: "center" }}>
        <T style={{ fontFamily: font.display400, fontSize: 12, letterSpacing: -0.4 }}>{short}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T v="box" numberOfLines={2}>
          {title}
        </T>
        <T v="small">{plural(s.count, "Probe", "Proben")}</T>
      </View>
      <Grade value={s.grade} />
      <Icon name="chev-r" small color={c.text2} />
    </Pressable>
  );
}

function Efz() {
  const { c } = useTheme();
  const e = useApi(() => api.efz(), [], { cache: "efz" });
  const [edit, setEdit] = useState<EfzModule | null>(null);
  if (e.error && !e.data) return <ErrorState message={e.error} onRetry={e.reload} />;
  if (!e.data)
    return (
      <SkeletonArea label="EFZ wird geladen">
        <SkBox h={400} />
      </SkeletonArea>
    );
  const d = e.data;
  if (!d.modules.length) return <Empty icon="chart" title="Noch keine EFZ-Module." />;
  return (
    <>
      <Kpis
        items={[
          { label: "Informatik EFZ", value: d.total !== null ? fmtGrade(d.total) : "–" },
          { label: "gibb (80 %)", value: d.gibb !== null ? fmtGrade(d.gibb) : "–" },
          { label: "üK (20 %)", value: d.uek !== null ? fmtGrade(d.uek) : "–" },
        ]}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[5], marginBottom: sp[5] }}>
        {d.status && <Status tone={TONE[d.status]} label={STATUS_LABEL.efz[d.status]} />}
        {d.internship && <Status tone={TONE[d.internship]} label={STATUS_LABEL.internship[d.internship]} />}
      </View>
      {[1, 2, 3].map((year) => {
        const mods = d.modules.filter((m) => m.year === year);
        if (!mods.length) return null;
        return (
          <Card key={year} pad={sp[7]} style={{ marginBottom: sp[6] }}>
            <T v="box" accessibilityRole="header" style={{ marginBottom: sp[3] }}>
              {year}. Ausbildungsjahr
            </T>
            {mods.map((m, i) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`${m.module} ${m.name}, ${m.place === "gibb" ? "gibb" : "üK"}, Note ${m.value ?? "keine"}. Bearbeiten`}
                onPress={() => setEdit(m)}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[4], minHeight: 52, borderTopWidth: i ? 1 : 0, borderTopColor: c.rule, opacity: pressed ? 0.6 : 1 })}
              >
                <T v="smallStrong" tone="text2" style={{ width: 36 }}>
                  {m.place === "gibb" ? "gibb" : "üK"}
                </T>
                <T style={{ flex: 1 }} numberOfLines={2}>
                  {m.module} {m.name}
                </T>
                <Grade value={m.value} />
              </Pressable>
            ))}
          </Card>
        );
      })}
      {edit && (
        <EfzSheet
          id={edit.id}
          label={`${edit.module} ${edit.name}`}
          value={edit.value}
          onClose={() => setEdit(null)}
          onDone={async () => {
            setEdit(null);
            await e.refresh();
          }}
        />
      )}
    </>
  );
}
