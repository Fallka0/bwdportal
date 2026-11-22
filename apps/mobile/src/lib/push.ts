import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { api } from "./api";

/** Im Vordergrund als Banner zeigen, wie im Hintergrund. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let current: string | null = null;

/**
 * Gerät für Push registrieren: Kanal (Android), Erlaubnis, Expo-Push-Token, beim Portal hinterlegen.
 * Ohne Erlaubnis, im Simulator oder ohne Firebase-Konfiguration (Android) passiert nichts.
 */
export async function registerForPush(): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;
  if (Platform.OS === "android") {
    // AndroidImportance kommt über export * aus den Typen; die Lint-Regel folgt dem nicht
    // eslint-disable-next-line import/namespace
    await Notifications.setNotificationChannelAsync("default", { name: "Benachrichtigungen", importance: Notifications.AndroidImportance.DEFAULT });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return;
  const { data } = await Notifications.getExpoPushTokenAsync();
  current = data;
  await api.registerPush(data, Platform.OS === "ios" ? "ios" : "android");
}

/** Beim Abmelden: Gerät beim Portal entfernen (solange die Session noch gilt). */
export async function unregisterPush(): Promise<void> {
  if (!current) return;
  await api.removePush(current).catch(() => {});
  current = null;
}

const go = (r: Notifications.NotificationResponse | null) => {
  const href = r?.notification.request.content.data?.href;
  if (typeof href === "string" && href.startsWith("/")) router.push(href as never);
};

/** Registrieren nach dem Login und Antippen einer Benachrichtigung: zur passenden Seite. */
export function usePush() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    registerForPush().catch(() => {});
    void Notifications.getLastNotificationResponseAsync().then(go).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(go);
    return () => sub.remove();
  }, []);
}
