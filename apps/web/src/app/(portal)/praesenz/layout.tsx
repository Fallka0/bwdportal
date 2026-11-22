import type { ReactNode } from "react";
import { requireTeacher } from "@/lib/auth";

/** Nur für Lehrpersonen. */
export default async function TeacherOnly({ children }: { children: ReactNode }) {
  await requireTeacher();
  return children;
}
