import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Zwischenspeicher für die letzte gute Antwort jeder Ansicht (offline lesbar).
 * Beim Abmelden wird alles gelöscht, weil Noten und Absenzen persönlich sind.
 */
const PREFIX = "cache:";

export type Cached<T> = { data: T; at: string };

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T, at: string) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ data, at }));
  } catch {
    // Speicher voll oder nicht verfügbar: dann eben ohne Offline-Stand.
  }
}

export async function clearCache() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    await AsyncStorage.multiRemove(keys);
  } catch {
    // nichts zu tun
  }
}
