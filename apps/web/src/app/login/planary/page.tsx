import type { Metadata } from "next";
import { PlanaryReturn } from "./PlanaryReturn";

export const metadata: Metadata = { title: "Anmelden" };

/** Rücksprung von auth.planary.ch. Die Tokens stehen im Fragment und kommen nur im Browser an. */
export default function PlanaryCallback() {
  return <PlanaryReturn />;
}
