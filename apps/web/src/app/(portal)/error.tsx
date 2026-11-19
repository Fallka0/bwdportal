"use client";

import { useEffect } from "react";
import { Banner, Button } from "@/components/ui";

/** Fehler beim Laden einer Seite im Portal: kurzer Satz und "Erneut laden". */
export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <>
      <div className="ph">
        <h1>Das hat nicht geklappt.</h1>
      </div>
      <Banner tone="err" action={<Button variant="line" small onClick={reset}>Erneut laden</Button>}>
        Die Daten konnten nicht geladen werden.
      </Banner>
    </>
  );
}
