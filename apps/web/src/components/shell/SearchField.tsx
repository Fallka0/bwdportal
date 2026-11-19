"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui";

/** Suche in der Kopfzeile. Taste "/" setzt den Fokus. Enter öffnet /suche. */
export function SearchField() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      className="srch"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = ref.current?.value.trim();
        if (q) router.push(`/suche?q=${encodeURIComponent(q)}`);
      }}
    >
      <label className="sr" htmlFor="top-search">
        Suchen
      </label>
      <Icon name="search" small />
      <input ref={ref} id="top-search" className="inp" type="search" name="q" placeholder="Suchen: Fächer, Dokumente, Links" autoComplete="off" />
      <kbd aria-hidden="true">/</kbd>
    </form>
  );
}
