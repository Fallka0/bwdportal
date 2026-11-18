import type { Metadata } from "next";
import { Showcase } from "./Showcase";

export const metadata: Metadata = { title: "Komponenten" };

/** Testseite der Design-Basis (Phase 1): alle Grundkomponenten in hell und dunkel. */
export default function KomponentenPage() {
  return (
    <main className="kt">
      <h1 className="sr">Komponenten</h1>
      <div className="kt-cols">
        <Showcase theme="light" />
        <Showcase theme="dark" />
      </div>
    </main>
  );
}
