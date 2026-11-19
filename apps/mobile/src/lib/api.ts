import { createApiClient } from "@bwd/shared/api";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Adresse des Portals (Web-App mit /api/v1).
 * EXPO_PUBLIC_API_URL hat Vorrang. In der Entwicklung: derselbe Rechner wie der Metro-Server, Port 3000.
 */
function baseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof location !== "undefined") return `${location.protocol}//${location.hostname}:3000`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:3000`;
}

export const API_URL = baseUrl();

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export function setApiToken(t: string | null) {
  token = t;
}

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export const api = createApiClient({ baseUrl: API_URL, getToken: () => token, onUnauthorized: () => onUnauthorized() });
