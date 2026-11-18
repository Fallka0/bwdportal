import type { ReactNode } from "react";
import { Shell } from "@/components/shell/Shell";
import { requireUser } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { env, me } = await requireUser();
  return (
    <Shell me={me} now={env.now}>
      {children}
    </Shell>
  );
}
