import { notFound } from "next/navigation";

/** Unbekannte Pfade: 404 innerhalb des Portals (mit Navigation). */
export default function Missing() {
  notFound();
}
