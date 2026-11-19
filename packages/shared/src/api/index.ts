/**
 * API-Client für /api/v1. Die App benutzt ihn mit Bearer-Token, das Web könnte ihn mit Cookie benutzen.
 * Jede Antwort wird mit dem passenden Zod-Schema geprüft.
 */
import { z } from "zod";
import {
  AbsencesOverview,
  AbsenceSubmit,
  Absence,
  ApiError,
  DemoAccount,
  DocumentGroups,
  GradesOverview,
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
  SubjectGrades,
  Timetable,
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
    accounts: () => call(z.object({ accounts: z.array(DemoAccount) }), "GET", "/auth/accounts"),
    signInMock: (accountId: string) => call(Token, "POST", "/auth/mock", { accountId }),
    logout: () => call(Ok, "POST", "/auth/logout"),
    me: () => call(Me, "GET", "/me"),
    updateSettings: (patch: Partial<Settings>) => call(Settings, "PATCH", "/me/settings", patch),
    home: () => call(Home, "GET", "/home"),
    timetable: (from: string, to: string) => call(Timetable, "GET", `/timetable${q({ from, to })}`),
    grades: (semester: number) => call(GradesOverview, "GET", `/grades${q({ semester })}`),
    subject: (code: string) => call(SubjectGrades, "GET", `/grades/${encodeURIComponent(code)}`),
    absences: () => call(AbsencesOverview, "GET", "/absences"),
    absenceLessons: (date: string) => call(z.object({ lessons: z.array(z.object({ period: z.number(), subjectCode: z.string().nullable(), subjectName: z.string().nullable(), subjectShort: z.string().nullable() })) }), "GET", `/absences/lessons${q({ date })}`),
    submitAbsence: (input: AbsenceSubmit) => call(Absence, "POST", "/absences", input),
    solTasks: (block?: number) => call(SolTasks, "GET", `/sol/tasks${q({ block })}`),
    setSolProgress: (id: string, percent: number) => call(Ok, "PATCH", `/sol/tasks/${encodeURIComponent(id)}`, { percent }),
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
    markAllRead: () => call(Ok, "POST", "/notifications/read"),
    markRead: (ids: string[]) => call(Ok, "POST", "/notifications/read", { ids }),
    /** Absolute URL für Dateien (Download mit Token als Query, weil Links keinen Header senden können). */
    fileUrl: (path: string) => `${opts.baseUrl}/api/v1${path}`,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
