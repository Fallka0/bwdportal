import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { tokens } from "@bwd/shared";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import "../styles/tokens.gen.css";
import "../styles/base.css";
import "../styles/components.css";
import "../styles/shell.css";
import "../styles/timegrid.css";

// Schriften liegen im Repo (variable woff2, Lizenz OFL) und werden selbst ausgeliefert.
const unbounded = localFont({ src: "../fonts/unbounded-latin-wght.woff2", weight: "200 900", variable: "--font-unbounded", display: "swap" });
const manrope = localFont({ src: "../fonts/manrope-latin-wght.woff2", weight: "200 800", variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: { default: "bwd Portal", template: "%s · bwd Portal" },
  description: "Stundenplan, Noten, Absenzen, SOL, Mitteilungen, Dokumente und Links für Lernende der bwd.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: tokens.color.light.frame,
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const pref = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="de-CH" className={`${unbounded.variable} ${manrope.variable}`} data-theme={pref === "system" ? undefined : pref}>
      <body>
        <ThemeProvider initial={pref}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
