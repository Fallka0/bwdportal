import type { MetadataRoute } from "next";
import { tokens } from "@bwd/shared";

/** Web-App-Manifest: das Portal lässt sich auf dem Homescreen installieren. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bwd Portal",
    short_name: "bwd Portal",
    description: "Stundenplan, Noten, Absenzen, SOL, Mitteilungen, Dokumente und Links für Lernende der bwd.",
    lang: "de-CH",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: tokens.color.light.bg,
    theme_color: tokens.color.light.frame,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Stundenplan", url: "/stundenplan" },
      { name: "Noten", url: "/noten" },
      { name: "Abmelden", url: "/absenzen?tab=abmeldungen&neu=abmeldung" },
    ],
  };
}
