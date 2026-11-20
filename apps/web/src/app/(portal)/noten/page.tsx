import type { Metadata } from "next";
import Link from "next/link";
import { getEfz, getPortfolioSemester } from "@bwd/db";
import { fmtGrade, gradeBar, isInsufficient, plural, STATUS_LABEL, type PortfolioSubjectRow } from "@bwd/shared";
import { Empty, Icon, Kpis, Status, type StatusTone } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { EfzValue, GradeActions, GradeDialogs, SemesterSelect } from "./GradeForms";

export const metadata: Metadata = { title: "Noten" };

type Search = { semester?: string; ansicht?: string };

const TONE: Record<"ok" | "risk" | "fail", StatusTone> = { ok: "ok", risk: "warn", fail: "err" };

/** Zeile eines Fachs oder Moduls: Kürzel, Name, Anzahl Proben, Balken, Zeugnisnote. */
function Row({ s, href, short }: { s: PortfolioSubjectRow; href: string; short: string }) {
  const low = s.grade !== null && isInsufficient(s.grade);
  return (
    <Link className={low ? "sj flag" : "sj"} href={href}>
      <span className="sj-i" aria-hidden="true">
        {short}
      </span>
      <span className="sj-m">
        <b>{s.module ? `${s.module} ${s.moduleName ?? ""}`.trim() : s.name}</b>
        <span className="s">
          {plural(s.count, "Probe", "Proben")}
          {s.raw !== null && s.module === null ? ` · Schnitt ${s.raw.toFixed(2)}` : ""}
        </span>
      </span>
      <span className={low ? "gb low" : "gb"} aria-hidden="true">
        <i style={{ width: `${gradeBar(s.grade ?? 1)}%` }} />
      </span>
      <span className={low ? "gv low" : "gv"}>
        <span className="sr">Note </span>
        {s.grade !== null ? fmtGrade(s.grade) : "–"}
      </span>
      <Icon name="chev-r" small />
    </Link>
  );
}

export default async function Grades({ searchParams }: { searchParams: Promise<Search> }) {
  const { env, me } = await requireUser();
  const sp = await searchParams;
  const efzView = sp.ansicht === "efz";
  const g = await getPortfolioSemester(env.db, me.id, env.now, Number(sp.semester) || undefined);
  const semesters = g.semesters.some((x) => x.n === g.n) ? g.semesters : [{ n: g.n, label: g.label, count: 0 }, ...g.semesters];
  const tabs = (
    <nav className="stabs" aria-label="Ansicht">
      <Link href={`/noten?semester=${g.n}`} aria-current={!efzView ? "page" : undefined} scroll={false}>
        Semester
      </Link>
      <Link href="/noten?ansicht=efz" aria-current={efzView ? "page" : undefined} scroll={false}>
        EFZ
      </Link>
    </nav>
  );

  return (
    <div className="tt-head">
      <div className="ph">
        <h1>Noten</h1>
        <div className="ph-a">
          {!efzView && <SemesterSelect semesters={semesters} value={g.n} />}
          <GradeActions semester={g.n} />
        </div>
      </div>
      <div className="seg-app" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="stack-s">
          {!efzView && <SemesterSelect semesters={semesters} value={g.n} />}
          <GradeActions semester={g.n} wide />
        </div>
      </div>
      {tabs}
      {efzView ? <Efz userId={me.id} env={env} /> : <Semester g={g} />}
      <GradeDialogs semester={g.n} />
    </div>
  );
}

function Semester({ g }: { g: Awaited<ReturnType<typeof getPortfolioSemester>> }) {
  if (g.count === 0) return <Empty icon="chart" title={`Noch keine Noten im ${g.n}. Semester.`} />;
  const sm = g.summary;
  const statuses = [
    sm.bmStatus && (["bm", sm.bmStatus] as const),
    sm.efzStatus && (["efz", sm.efzStatus] as const),
    sm.internship && (["internship", sm.internship] as const),
  ].filter((x): x is readonly ["bm" | "efz" | "internship", "ok" | "risk" | "fail"] => !!x);
  return (
    <>
      <Kpis
        items={[
          { label: "BM-Schnitt", value: sm.bm !== null ? fmtGrade(sm.bm) : "–", tone: sm.bmStatus === "fail" ? "err" : sm.bmStatus === "risk" ? "warn" : undefined },
          { label: "EFZ (Informatik)", value: sm.efz !== null ? fmtGrade(sm.efz) : "–", tone: sm.efzStatus === "fail" ? "err" : sm.efzStatus === "risk" ? "warn" : undefined },
          { label: "Ungenügend", value: sm.insufficient, tone: sm.insufficient ? "err" : undefined },
        ]}
      />
      <p className="st-line" aria-label="Stand">
        {statuses.map(([k, v]) => (
          <Status key={k} tone={TONE[v]}>
            {STATUS_LABEL[k][v]}
          </Status>
        ))}
        <span className="s">{plural(g.count, "Probe", "Proben")}</span>
      </p>
      {g.subjects.length > 0 && (
        <section className="card" aria-label="Fächer">
          <div className="subj">
            {g.subjects.map((s) => (
              <Row key={s.code} s={s} short={s.code} href={`/noten/${encodeURIComponent(s.code)}?semester=${g.n}`} />
            ))}
          </div>
        </section>
      )}
      {g.modules.length > 0 && (
        <section className="card" aria-labelledby="in-h" style={{ marginTop: "var(--sp-6)" }}>
          <div className="box-h">
            <h2 id="in-h" className="box-t">
              Informatik (gibb)
            </h2>
            <span className={g.informatics && isInsufficient(g.informatics.raw) ? "gv low" : "gv"}>
              <span className="sr">Note Informatik </span>
              {g.informatics ? g.informatics.raw.toFixed(2) : "–"}
            </span>
          </div>
          <div className="subj">
            {g.modules.map((m) => (
              <Row key={m.module} s={m} short="IN" href={`/noten/IN?semester=${g.n}&modul=${m.module}`} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

async function Efz({ userId, env }: { userId: string; env: Awaited<ReturnType<typeof requireUser>>["env"] }) {
  const e = await getEfz(env.db, userId);
  if (!e.modules.length) return <Empty icon="chart" title="Noch keine EFZ-Module." />;
  return (
    <>
      <Kpis
        items={[
          { label: "Informatik EFZ", value: e.total !== null ? fmtGrade(e.total) : "–", tone: e.status === "fail" ? "err" : e.status === "risk" ? "warn" : undefined },
          { label: "gibb-Module (80 %)", value: e.gibb !== null ? fmtGrade(e.gibb) : "–" },
          { label: "üK (20 %)", value: e.uek !== null ? fmtGrade(e.uek) : "–" },
        ]}
      />
      {(e.status || e.internship) && (
        <p className="st-line" aria-label="Stand">
          {e.status && <Status tone={TONE[e.status]}>{STATUS_LABEL.efz[e.status]}</Status>}
          {e.internship && <Status tone={TONE[e.internship]}>{STATUS_LABEL.internship[e.internship]}</Status>}
        </p>
      )}
      {[1, 2, 3].map((year) => {
        const mods = e.modules.filter((m) => m.year === year);
        if (!mods.length) return null;
        return (
          <section key={year} className="card" aria-labelledby={`efz-${year}`} style={{ marginTop: "var(--sp-6)" }}>
            <h2 id={`efz-${year}`} className="box-t" style={{ marginBottom: "var(--sp-4)" }}>
              {year}. Ausbildungsjahr
            </h2>
            {mods.map((m) => (
              <div key={m.id} className="efz-r">
                <span className="efz-p">{m.place === "gibb" ? "gibb" : "üK"}</span>
                <span className="efz-n">
                  <b>{m.module}</b> {m.name}
                </span>
                <EfzValue id={m.id} label={`${m.module} ${m.name}`} value={m.value} />
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
