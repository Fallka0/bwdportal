import type { ReactNode } from "react";
import { requireStudent } from "@/lib/auth";

/** Nur für Lernende. */
export default async function StudentOnly({ children }: { children: ReactNode }) {
  await requireStudent();
  return children;
}
