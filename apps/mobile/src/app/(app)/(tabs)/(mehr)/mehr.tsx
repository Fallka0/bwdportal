import type { IconName } from "@bwd/shared/icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useMe } from "@/lib/me";
import { Screen } from "@/shell/Screen";
import { radius, sp, useTheme } from "@/theme";
import { Icon, T } from "@/ui";

/** Übrige Bereiche mit Zähler. */
export default function More() {
  const { c } = useTheme();
  const me = useMe();
  const n = me.data?.counts;
  const items: { href: string; title: string; sub?: string; icon: IconName; dot?: boolean }[] = [
    { href: "/sol", title: "SOL", sub: "SOL-Tag am Freitag", icon: "book" },
    { href: "/absenzen", title: "Absenzen", sub: n ? `Kontingent ${n.contingentAvailable} von ${n.contingentSize}` : undefined, icon: "clock", dot: n?.contingentAvailable === 0 },
    { href: "/mitteilungen", title: "Mitteilungen", sub: n?.unreadNews ? `${n.unreadNews} neu` : undefined, icon: "megaphone" },
    { href: "/dokumente", title: "Dokumente", icon: "folder" },
    { href: "/links", title: "Links", icon: "grid4" },
    { href: "/benachrichtigungen", title: "Benachrichtigungen", sub: n?.unreadNotifications ? `${n.unreadNotifications} neu` : undefined, icon: "bell" },
    { href: "/profil", title: "Profil und Einstellungen", icon: "user" },
  ];
  return (
    <Screen title="Mehr" onRefresh={me.refresh} refreshing={me.refreshing}>
      <View style={{ gap: sp[3] }}>
        {items.map((m) => (
          <Pressable
            key={m.href}
            accessibilityRole="link"
            accessibilityLabel={[m.title, m.sub].filter(Boolean).join(", ")}
            onPress={() => router.push(m.href as never)}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[6], minHeight: 64, paddingHorizontal: sp[6], paddingVertical: sp[5], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : c.panel })}
          >
            <View style={{ width: 40, height: 40, borderRadius: radius.l, backgroundColor: c.onBg, alignItems: "center", justifyContent: "center" }}>
              <Icon name={m.icon} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="box">{m.title}</T>
              {m.sub && <T v="small">{m.sub}</T>}
            </View>
            {m.dot && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} />}
            <Icon name="chev-r" small color={c.text2} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
