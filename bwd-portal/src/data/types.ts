export type Role = 'lernende' | 'lehrperson';

export type Semester = {
  label: string;
  avg: number;
  prev: number;
};

export type Subject = {
  /** Full name; the part before " — " is the short name shown in lists. */
  name: string;
  grade: number;
  prev: number;
  count: number;
  teacher: string;
};

export type Exam = {
  name: string;
  grade: number;
  weight: string;
  meta: string;
};

export type LessonState = 'normal' | 'cancelled' | 'roomChange';

export type Lesson = {
  start: string;
  subject: string;
  room: string;
  teacher: string;
  state: LessonState;
};

export type TeacherAbbr = {
  abbr: string;
  name: string;
  subject: string;
};

export type Goal = {
  text: string;
  meta: string;
};

export type SolSlot = {
  time: string;
  room: string;
  full: boolean;
};

export type UpcomingItem = {
  date: string;
  title: string;
  meta: string;
  /** Red marks the next exam; everything else stays grey. */
  urgent: boolean;
};

export type Notice = {
  from: string;
  title: string;
  meta: string;
};

export type Identity = {
  name: string;
  mail: string;
  initials: string;
  schoolClass: string;
};
