import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useMe } from "@/lib/me";
import { font, fs, radius, size, sp, tracking, useTheme } from "@/theme";
import { Count, Icon, T } from "@/ui";

/** Kopfzeile: Logo (Hauptseiten) oder Zurück (Unterseiten), Glocke mit Zähler, Avatar. */
export function AppHeader({ back }: { back?: { label: string; href?: string } }) {
  const { c } = useTheme();
  const me = useMe();
  const unread = me.data?.counts.unreadNotifications ?? 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3], minHeight: 52, paddingLeft: sp[8], paddingRight: sp[7], paddingTop: sp[2] }}>
      {back ? (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Zurück zu ${back.label}`}
          onPress={() => (router.canGoBack() ? router.back() : back.href && router.replace(back.href as never))}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center", gap: sp[1], minHeight: size.touchMin, marginLeft: -sp[2] }}
        >
          <Icon name="chev-l" />
          <T style={{ fontFamily: font.body600, fontSize: fs.l }}>{back.label}</T>
        </Pressable>
      ) : (
        <Pressable accessibilityRole="link" accessibilityLabel="bwd Portal, Übersicht" onPress={() => router.navigate("/")} style={{ flexDirection: "row", alignItems: "center", gap: sp[4], minHeight: size.touchMin }}>
          <View style={{ width: 26, height: 26, borderRadius: radius.m, backgroundColor: c.btn, alignItems: "center", justifyContent: "center" }}>
            <T style={{ fontFamily: font.display600, fontSize: 8, color: c.btnFg, letterSpacing: -0.5 }}>bwd</T>
          </View>
          <T style={{ fontFamily: font.display400, fontSize: fs.l, letterSpacing: tracking(fs.l) }}>Portal</T>
        </Pressable>
      )}
      <View style={{ flex: 1 }} />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={unread ? `Benachrichtigungen, ${unread} neu` : "Benachrichtigungen"}
        onPress={() => router.navigate("/benachrichtigungen")}
        style={{ width: size.touchMin, height: size.touchMin, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="bell" />
        {unread > 0 && (
          <View style={{ position: "absolute", top: 4, right: 4 }}>
            <Count n={unread} />
          </View>
        )}
      </Pressable>
      <Pressable accessibilityRole="link" accessibilityLabel="Profil" onPress={() => router.navigate("/profil")} hitSlop={8} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.btn, alignItems: "center", justifyContent: "center", margin: 7 }}>
        <T style={{ fontFamily: font.display400, fontSize: fs.micro, color: c.btnFg }}>{me.data?.initials ?? ""}</T>
      </Pressable>
    </View>
  );
}
