/**
 * API-Client für /api/v1. Die App benutzt ihn mit Bearer-Token, das Web könnte ihn mit Cookie benutzen.
 * Jede Antwort wird mit dem passenden Zod-Schema geprüft.
 */
import { z } from "zod";
import {
  AbsencesOverview,
  AbsenceNotice,
  AbsenceNoticeSubmit,
  Dispensation,
  DispensationSubmit,
  ApiError,
  DemoAccount,
  DocumentGroups,
  PortfolioSemester,
  PortfolioSubjectDetail,
  PortfolioEntry,
  type PortfolioEntryInput,
  EfzOverview,
  Home,
  LinkItem,
  Me,
  NewsArticle,
  NewsItem,
  NotificationItem,
  Settings,
  SolCalendar,
  SolPlanCreate,
  SolPortfolio,
  SolTasks,
  type SolStatus,
  Timetable,
  TeacherHome,
  TestItem,
  type TestInput,
  Subject,
  AttendanceSlot,
  AttendanceSheet,
  TeacherClass,
  ClassView,
  Gradebook,
  Assessment,
  AssessmentSheet,
  type AssessmentInput,
  type AssessmentGradesInput,
  Classroom,
  ClassPost,
  type ClassPostInput,
} from "../schemas";

export class ApiFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => Promise<string | null> | string | null;
  fetch?: typeof fetch;
  /** Wird bei 401 aufgerufen, z. B. um zum Login zu wechseln. */
  onUnauthorized?: () => void;
};

const Ok = z.object({ ok: z.boolean() });
const Token = z.object({ token: z.string(), expiresAt: z.string() });

export function createApiClient(opts: ApiClientOptions) {
  const f = opts.fetch ?? fetch;

  async function call<S extends z.ZodType>(schema: S, method: string, path: string, body?: unknown): Promise<z.infer<S>> {
    const token = await opts.getToken?.();
    let res: Response;
    try {
      res = await f(`${opts.baseUrl}/api/v1${path}`, {
        method,
        headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiFailure(0, "offline", "Keine Verbindung zum Portal.");
    }
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401) opts.onUnauthorized?.();
      const e = ApiError.safeParse(data);
      throw new ApiFailure(res.status, e.success ? e.data.error.code : "http", e.success ? e.data.error.message : "Etwas ist schiefgelaufen.", e.success ? e.data.error.field : undefined);
    }
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiFailure(res.status, "invalid_response", "Unerwartete Antwort vom Portal.");
    return parsed.data;
  }

  const q = (params: Record<string, string | number | undefined>) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]).toString();
    return s ? `?${s}` : "";
  };

  return {
    authConfig: () => call(z.object({ mock: z.boolean(), microsoft: z.boolean(), planary: z.boolean().default(false) }), "GET", "/auth/config"),
    accounts: () => call(z.object({ accounts: z.array(DemoAccount) }), "GET", "/auth/accounts"),
    /** Einmal-Code aus dem Microsoft-Login gegen das Session-Token tauschen. */
    exchange: (code: string) => call(z.object({ token: z.string() }), "POST", "/auth/exchange", { code }),
    signInMock: (accountId: string) => call(Token, "POST", "/auth/mock", { accountId }),
    logout: () => call(Ok, "POST", "/auth/logout"),
    me: () => call(Me, "GET", "/me"),
    updateSettings: (patch: Partial<Settings>) => call(Settings, "PATCH", "/me/settings", patch),
    home: () => call(Home, "GET", "/home"),
    timetable: (from: string, to: string) => call(Timetable, "GET", `/timetable${q({ from, to })}`),
    grades: (semester?: number) => call(PortfolioSemester, "GET", `/grades${q({ semester })}`),
    subject: (code: string, semester?: number, module?: string | null) => call(PortfolioSubjectDetail, "GET", `/grades/${encodeURIComponent(code)}${q({ semester, modul: module ?? undefined })}`),
    addGrade: (input: PortfolioEntryInput) => call(PortfolioEntry, "POST", "/grades/entries", input),
    updateGrade: (id: string, input: PortfolioEntryInput) => call(PortfolioEntry, "PATCH", `/grades/entries/${encodeURIComponent(id)}`, input),
    deleteGrade: (id: string) => call(Ok, "DELETE", `/grades/entries/${encodeURIComponent(id)}`),
    efz: () => call(EfzOverview, "GET", "/grades/efz"),
    setEfz: (id: string, value: number | null) => call(Ok, "PATCH", `/grades/efz/${encodeURIComponent(id)}`, { value }),
    absences: () => call(AbsencesOverview, "GET", "/absences"),
    absenceLessons: (date: string) => call(z.object({ lessons: z.array(z.object({ period: z.number(), subjectCode: z.string().nullable(), subjectName: z.string().nullable(), subjectShort: z.string().nullable() })) }), "GET", `/absences/lessons${q({ date })}`),
    submitAbsenceNotice: (input: AbsenceNoticeSubmit) => call(AbsenceNotice, "POST", "/absences/notices", input),
    updateAbsenceNotice: (id: string, input: AbsenceNoticeSubmit) => call(AbsenceNotice, "PATCH", `/absences/notices/${encodeURIComponent(id)}`, input),
    deleteAbsenceNotice: (id: string) => call(Ok, "DELETE", `/absences/notices/${encodeURIComponent(id)}`),
    submitDispensation: (input: DispensationSubmit) => call(Dispensation, "POST", "/absences/dispensations", input),
    updateDispensation: (id: string, input: DispensationSubmit) => call(Dispensation, "PATCH", `/absences/dispensations/${encodeURIComponent(id)}`, input),
    deleteDispensation: (id: string) => call(Ok, "DELETE", `/absences/dispensations/${encodeURIComponent(id)}`),
    solTasks: (block?: number) => call(SolTasks, "GET", `/sol/tasks${q({ block })}`),
    setSolStatus: (id: string, status: SolStatus) => call(Ok, "PATCH", `/sol/tasks/${encodeURIComponent(id)}`, { status }),
    solCalendar: (day?: string) => call(SolCalendar, "GET", `/sol/plan${q({ day })}`),
    addSolPlan: (input: SolPlanCreate) => call(z.object({ id: z.string() }), "POST", "/sol/plan", input),
    deleteSolPlan: (id: string) => call(Ok, "DELETE", `/sol/plan${q({ id })}`),
    solPortfolio: () => call(SolPortfolio, "GET", "/sol/portfolio"),
    putSolPortfolio: (solDayId: string, checkIn: string, checkOut: string) => call(Ok, "PUT", "/sol/portfolio", { solDayId, checkIn, checkOut }),
    news: () => call(z.object({ items: z.array(NewsItem) }), "GET", "/news"),
    article: (id: string) => call(NewsArticle, "GET", `/news/${encodeURIComponent(id)}`),
    documents: (search = "", group?: string) => call(DocumentGroups, "GET", `/documents${q({ q: search, group })}`),
    links: () => call(z.object({ items: z.array(LinkItem) }), "GET", "/links"),
    notifications: () => call(z.object({ items: z.array(NotificationItem) }), "GET", "/notifications"),
    calendar: () => call(z.object({ url: z.string(), webcal: z.string() }), "GET", "/me/calendar"),
    resetCalendar: () => call(z.object({ url: z.string(), webcal: z.string() }), "POST", "/me/calendar"),
    markAllRead: () => call(Ok, "POST", "/notifications/read"),
    markRead: (ids: string[]) => call(Ok, "POST", "/notifications/read", { ids }),
    // Prüfungen
    tests: (opts: { past?: boolean; from?: string; to?: string } = {}) => call(z.object({ tests: z.array(TestItem) }), "GET", `/tests${q({ vergangen: opts.past ? "1" : undefined, von: opts.from, bis: opts.to })}`),
    testOptions: () => call(z.object({ subjects: z.array(Subject), classes: z.array(z.object({ classCode: z.string(), subject: Subject })) }), "GET", "/tests/options"),
    createTest: (input: TestInput) => call(TestItem, "POST", "/tests", input),
    updateTest: (id: string, input: TestInput) => call(TestItem, "PATCH", `/tests/${encodeURIComponent(id)}`, input),
    deleteTest: (id: string) => call(Ok, "DELETE", `/tests/${encodeURIComponent(id)}`),
    // Lehrpersonen
    teacherHome: () => call(TeacherHome, "GET", "/teacher/home"),
    attendance: () => call(z.object({ slots: z.array(AttendanceSlot) }), "GET", "/attendance"),
    attendanceSheet: (lessonId: string) => call(AttendanceSheet, "GET", `/attendance/${encodeURIComponent(lessonId)}`),
    saveAttendance: (lessonId: string, absent: string[]) => call(AttendanceSheet, "PUT", `/attendance/${encodeURIComponent(lessonId)}`, { absent }),
    classes: () => call(z.object({ classes: z.array(TeacherClass) }), "GET", "/classes"),
    classView: (code: string) => call(ClassView, "GET", `/classes/${encodeURIComponent(code)}`),
    gradebook: (classCode: string, subject: string, semester?: number) => call(Gradebook, "GET", `/gradebook${q({ klasse: classCode, fach: subject, semester })}`),
    createAssessment: (input: AssessmentInput) => call(Assessment, "POST", "/assessments", input),
    assessment: (id: string) => call(AssessmentSheet, "GET", `/assessments/${encodeURIComponent(id)}`),
    saveAssessmentGrades: (id: string, input: AssessmentGradesInput) => call(AssessmentSheet, "PUT", `/assessments/${encodeURIComponent(id)}/grades`, input),
    // Klassenraum
    classroom: (classCode?: string, subject?: string) => call(Classroom, "GET", `/classroom${q({ klasse: classCode, fach: subject })}`),
    createClassPost: (input: ClassPostInput) => call(ClassPost, "POST", "/classroom/posts", input),
    deleteClassPost: (id: string) => call(Ok, "DELETE", `/classroom/posts/${encodeURIComponent(id)}`),
    /** Absolute URL für Dateien (Download mit Token als Query, weil Links keinen Header senden können). */
    fileUrl: (path: string) => `${opts.baseUrl}/api/v1${path}`,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
