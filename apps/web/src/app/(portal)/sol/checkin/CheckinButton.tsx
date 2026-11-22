"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, useToast } from "@/components/ui";

export function CheckinButton({ code, next }: { code: string; next: "in" | "out" }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      {error && (
        <p className="f-e" role="alert">
          {error}
        </p>
      )}
      <Button
        icon="check"
        wide
        busy={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const res = await fetch("/api/v1/sol/checkin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
            const b = (await res.json().catch(() => null)) as { error?: { message: string }; checkIn?: string; checkOut?: string } | null;
            if (!res.ok) return setError(b?.error?.message ?? "Das hat nicht geklappt. Versuche es nochmals.");
            toast.show(next === "in" ? `Eingecheckt um ${b?.checkIn}.` : `Ausgecheckt um ${b?.checkOut}.`);
            router.refresh();
          } catch {
            setError("Keine Verbindung. Versuche es nochmals.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {next === "in" ? "Einchecken" : "Auschecken"}
      </Button>
    </>
  );
}
