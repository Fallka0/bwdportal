"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { fmtShort } from "@bwd/shared";
import { Banner, Button } from "@/components/ui";

/** Banner, wenn der letzte Import alt ist oder fehlschlug. Zeigt den Stand des Plans. */
export function StaleBanner({ lastRunAt, today }: { lastRunAt: string | null; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const stand = lastRunAt ? (lastRunAt.slice(0, 10) === today ? `von heute ${lastRunAt.slice(11, 16)}` : `vom ${fmtShort(lastRunAt.slice(0, 10))} ${lastRunAt.slice(11, 16)}`) : null;
  return (
    <Banner
      action={
        <Button variant="line" small busy={pending} onClick={() => start(() => router.refresh())}>
          Erneut laden
        </Button>
      }
    >
      <b>WebUntis antwortet gerade nicht.</b> {stand ? `Du siehst den Stundenplan ${stand}. Änderungen seither fehlen.` : "Es gibt noch keinen Stand des Plans."}
    </Banner>
  );
}
