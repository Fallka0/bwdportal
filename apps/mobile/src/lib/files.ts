import { Linking } from "react-native";
import { API_URL } from "./api";
import { storage } from "./storage";

/** Datei aus /api/v1/files öffnen; das Token kommt als ?t mit, weil der Browser keinen Header senden kann. */
export async function openApiFile(path: string, inline = true) {
  const t = await storage.get("session");
  const sep = path.includes("?") ? "&" : "?";
  await Linking.openURL(`${API_URL}/api/v1${path}${sep}${[inline ? "inline=1" : "", t ? `t=${encodeURIComponent(t)}` : ""].filter(Boolean).join("&")}`);
}
