import type {
  Exam,
  Goal,
  Lesson,
  Notice,
  Role,
  Semester,
  SolSlot,
  Subject,
  TeacherAbbr,
  UpcomingItem,
} from './types';

/**
 * Mock content carried over from the Claude Design prototype. Sign-in is real
 * (Microsoft Entra ID); everything below stands in for the school's APIs.
 */

export const SEMESTERS: Semester[] = [
  { label: 'FS 2026', avg: 4.62, prev: 4.71 },
  { label: 'HS 2026', avg: 4.87, prev: 4.62 },
];

/** Index of the semester shown first. */
export const CURRENT_SEMESTER = 1;

export const SUBJECTS: Record<string, Subject[]> = {
  'HS 2026': [
    { name: 'W&G — Wirtschaft und Gesellschaft', grade: 5.1, prev: 4.8, count: 4, teacher: 'GIO' },
    { name: 'IKA — Information, Kommunikation', grade: 4.6, prev: 4.4, count: 3, teacher: 'BRT' },
    { name: 'Deutsch', grade: 4.9, prev: 4.7, count: 3, teacher: 'HFM' },
    { name: 'Französisch', grade: 3.8, prev: 3.5, count: 4, teacher: 'DUC' },
    { name: 'Englisch', grade: 5.3, prev: 5.0, count: 3, teacher: 'WLS' },
    { name: 'Sport', grade: 5.5, prev: 5.3, count: 2, teacher: 'AMB' },
  ],
  'FS 2026': [
    { name: 'W&G — Wirtschaft und Gesellschaft', grade: 4.8, prev: 4.9, count: 4, teacher: 'GIO' },
    { name: 'IKA — Information, Kommunikation', grade: 4.4, prev: 4.6, count: 3, teacher: 'BRT' },
    { name: 'Deutsch', grade: 4.7, prev: 4.8, count: 3, teacher: 'HFM' },
    { name: 'Französisch', grade: 3.5, prev: 3.9, count: 4, teacher: 'DUC' },
    { name: 'Englisch', grade: 5.0, prev: 5.1, count: 3, teacher: 'WLS' },
    { name: 'Sport', grade: 5.3, prev: 5.0, count: 2, teacher: 'AMB' },
  ],
};

const EXAMS_BY_SUBJECT: Record<string, Exam[]> = {
  'W&G — Wirtschaft und Gesellschaft': [
    { name: 'Prüfung Rechnungswesen 2', grade: 5.5, weight: '2×', meta: '12.08.2026 · Klasse Ø 4.8' },
    { name: 'Test Kalkulation', grade: 4.5, weight: '1×', meta: '01.07.2026 · Klasse Ø 4.6' },
    { name: 'Semesterarbeit Marketing', grade: 5.0, weight: '1×', meta: '10.06.2026 · Klasse Ø 4.9' },
  ],
  'Französisch': [
    { name: 'Vocabulaire unité 6', grade: 3.5, weight: '1×', meta: '14.08.2026 · Klasse Ø 4.5' },
    { name: 'Compréhension orale', grade: 4.0, weight: '2×', meta: '02.07.2026 · Klasse Ø 4.7' },
    { name: 'Grammaire — subjonctif', grade: 3.5, weight: '1×', meta: '18.06.2026 · Klasse Ø 4.4' },
    { name: 'Exposé oral', grade: 4.5, weight: '1×', meta: '05.06.2026 · Klasse Ø 4.8' },
  ],
};

const DEFAULT_EXAMS: Exam[] = [
  { name: 'Prüfung 3', grade: 5.0, weight: '2×', meta: '13.08.2026 · Klasse Ø 4.7' },
  { name: 'Prüfung 2', grade: 4.5, weight: '1×', meta: '26.06.2026 · Klasse Ø 4.5' },
  { name: 'Prüfung 1', grade: 5.0, weight: '1×', meta: '04.06.2026 · Klasse Ø 4.6' },
];

export function examsFor(subjectName: string): Exam[] {
  return EXAMS_BY_SUBJECT[subjectName] ?? DEFAULT_EXAMS;
}

export const WEEK_DAYS = [
  { dow: 'Mo', date: '18', title: 'Montag 18. August' },
  { dow: 'Di', date: '19', title: 'Dienstag 19. August' },
  { dow: 'Mi', date: '20', title: 'Mittwoch 20. August' },
  { dow: 'Do', date: '21', title: 'Donnerstag 21. August' },
  { dow: 'Fr', date: '22', title: 'Freitag 22. August' },
];

/** Index of "today" within WEEK_DAYS — the only day carrying changes. */
export const TODAY_INDEX = 1;

const TODAY_LESSONS: Lesson[] = [
  { start: '08:35', subject: 'W&G — Rechnungswesen', room: 'A 214', teacher: 'GIO', state: 'normal' },
  { start: '09:25', subject: 'W&G — Rechnungswesen', room: 'A 214', teacher: 'GIO', state: 'normal' },
  { start: '10:30', subject: 'Französisch', room: 'B 214', teacher: 'DUC', state: 'roomChange' },
  { start: '11:20', subject: 'IKA', room: 'C 002', teacher: 'BRT', state: 'normal' },
  { start: '13:15', subject: 'SOL — Lernlandschaft', room: 'D 1', teacher: 'HFM', state: 'normal' },
  { start: '14:55', subject: 'Sport', room: 'Halle', teacher: 'AMB', state: 'cancelled' },
  { start: '15:45', subject: 'Englisch', room: 'A 108', teacher: 'WLS', state: 'normal' },
];

/** Other weekdays reuse the first five lessons, as the prototype did. */
export function lessonsForDay(dayIndex: number): Lesson[] {
  return dayIndex === TODAY_INDEX ? TODAY_LESSONS : TODAY_LESSONS.slice(0, 5);
}

export const CHANGE_LINE = 'Sport 14:55 fällt aus · Französisch neu in B 214';

/** Room a moved lesson was originally scheduled in. */
export const PREVIOUS_ROOM = 'B 106';

export const TEACHER_LEGEND: TeacherAbbr[] = [
  { abbr: 'GIO', name: 'M. Giovannacci', subject: 'W&G' },
  { abbr: 'BRT', name: 'S. Bertschi', subject: 'IKA' },
  { abbr: 'HFM', name: 'A. Hofmann', subject: 'Deutsch' },
  { abbr: 'DUC', name: 'C. Ducommun', subject: 'Französisch' },
  { abbr: 'WLS', name: 'K. Wälchli', subject: 'Englisch' },
  { abbr: 'AMB', name: 'R. Amberg', subject: 'Sport' },
];

export const GOALS: Goal[] = [
  { text: 'Abschlussbuchungen üben', meta: 'W&G · bis Fr 22.08. · 90 min' },
  { text: 'Vocabulaire unité 7 lernen', meta: 'Französisch · bis Do 21.08.' },
  { text: 'Lernjournal Woche 34', meta: 'SOL · bis So 24.08.' },
  { text: 'Präsentation Marketing gliedern', meta: 'W&G · bis Mi 27.08.' },
];

/** Goals already ticked off when the app opens. */
export const INITIAL_DONE_GOALS = [2];

export const SOL_SLOTS: SolSlot[] = [
  { time: '13:15', room: 'D 1', full: false },
  { time: '15:00', room: 'D 2', full: false },
  { time: '16:30', room: 'belegt', full: true },
];

export const SOL_FEEDBACK = {
  text: '«Deine Zielformulierung ist präzise. Halte auch fest, was nicht funktioniert hat.»',
  meta: 'A. Hofmann · 15.08.2026',
};

export const TODAY_LABEL = 'Dienstag, 19. August';

type HomeContent = {
  hello: string;
  nowTitle: string;
  nowSpan: string;
  nowRoom: string;
  nowTeacher: string;
  nowCountdown: string;
  upcoming: UpcomingItem[];
  avgTitle: string;
  avgMeta: string;
  avgValue: string;
  avgDelta: number;
  notice: Notice;
};

const HOME: Record<Role, HomeContent> = {
  lernende: {
    hello: 'Hallo Lena',
    nowTitle: 'W&G — Rechnungswesen',
    nowSpan: '08:35 – 09:20',
    nowRoom: 'Raum A 214',
    nowTeacher: 'GIO',
    nowCountdown: 'Beginnt in 8 Minuten',
    upcoming: [
      { date: 'Do 21.', title: 'Vocabulaire unité 7', meta: 'Französisch · Prüfung', urgent: true },
      { date: 'Mo 25.', title: 'Abschlussbuchungen', meta: 'W&G · Prüfung, Gewicht 2×', urgent: false },
    ],
    avgTitle: 'Notenschnitt',
    avgMeta: 'HS 2026',
    avgValue: '4.87',
    avgDelta: 0.25,
    notice: {
      from: 'Mitteilung — Sekretariat KBS',
      title: 'Anmeldung für die Wahlfächer Frühling 2027 ist offen.',
      meta: 'Heute, 07:40',
    },
  },
  lehrperson: {
    hello: 'Guten Morgen',
    nowTitle: 'Deutsch — Textanalyse',
    nowSpan: '08:35 – 09:20',
    nowRoom: 'A 118 · KBS 3c',
    nowTeacher: 'HFM',
    nowCountdown: 'Beginnt in 8 Minuten',
    upcoming: [
      { date: 'Do 21.', title: 'Textanalyse korrigieren', meta: 'KBS 3c · 24 Arbeiten', urgent: true },
      { date: 'Di 26.', title: 'Elterngespräche', meta: 'A 118 · ab 17:00', urgent: false },
    ],
    avgTitle: 'Klassenschnitt',
    avgMeta: 'HS 2026 · 3 unter Promotionsgrenze',
    avgValue: '4.61',
    avgDelta: 0.09,
    notice: {
      from: 'Mitteilung — Rektorat KBS',
      title: 'Zeugnisnoten HS 2026 bis 18. September erfassen.',
      meta: 'Heute, 07:40',
    },
  },
};

export function homeContent(role: Role): HomeContent {
  return HOME[role];
}

/** Class average shown to a teacher, independent of the selected semester. */
export const CLASS_AVERAGE = 4.61;

export const PROFILE_ROWS: Record<Role, { label: string; value: string }[]> = {
  lernende: [
    { label: 'Klasse', value: 'KBS 3c' },
    { label: 'Lehrgang', value: 'Kaufmännische Berufsschule' },
    { label: 'Klassenlehrperson', value: 'A. Hofmann' },
    { label: 'Semester', value: 'HS 2026' },
  ],
  lehrperson: [
    { label: 'Rolle', value: 'Lehrperson' },
    { label: 'Fächer', value: 'Deutsch · SOL' },
    { label: 'Klassen', value: 'KBS 3c, 1a' },
    { label: 'Kürzel', value: 'HFM' },
  ],
};

export const SETTINGS_ROWS = [
  { label: 'Benachrichtigungen', value: 'Ein' },
  { label: 'Sprache', value: 'Deutsch' },
  { label: 'Kalender abonnieren', value: '' },
];

/**
 * Stand-in for the school's class roster: sign-in returns a bwd address, and
 * the class is looked up from it rather than typed in by the student.
 */
export function assignClass(mail: string): string {
  const teacher = TEACHER_MAILS.includes(mail.toLowerCase());
  return teacher ? 'KBS 3c, 1a' : 'KBS 3c';
}

const TEACHER_MAILS = ['andrea.hofmann@bwdbern.ch'];

export function roleForMail(mail: string): Role {
  return TEACHER_MAILS.includes(mail.toLowerCase()) ? 'lehrperson' : 'lernende';
}
