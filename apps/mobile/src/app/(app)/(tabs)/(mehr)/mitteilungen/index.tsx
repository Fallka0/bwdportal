import { fmtDate } from "@bwd/shared";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, useTheme } from "@/theme";
import { Empty, Icon, SkBox, SkeletonArea, T } from "@/ui";

export default function News() {
  const { c } = useTheme();
  const n = useApi(() => api.news(), [], { cache: "news" });
  return (
    <Screen title="Mitteilungen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={n.refresh} refreshing={n.refreshing}>
      {n.error && !n.data ? (
        <ErrorState message={n.error} onRetry={n.reload} />
      ) : !n.data ? (
        <SkeletonArea label="Mitteilungen werden geladen">
          <View style={{ gap: sp[5] }}>
            {[1, 2, 3].map((i) => (
              <SkBox key={i} h={110} />
            ))}
          </View>
        </SkeletonArea>
      ) : n.data.items.length === 0 ? (
        <Empty icon="megaphone" title="Keine Mitteilungen." />
      ) : (
        <View style={{ gap: sp[5] }}>
          {n.data.items.map((m) => (
            <Pressable
              key={m.id}
              accessibilityRole="link"
              accessibilityLabel={`${m.unread ? "Ungelesen: " : ""}${m.title}${m.pinned ? ", angeheftet" : ""}`}
              onPress={() => router.push(`/mitteilungen/${m.id}`)}
              style={({ pressed }) => ({ padding: sp[7], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : c.panel, gap: sp[2] })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: sp[3] }}>
                {m.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} />}
                <T style={{ flex: 1, fontFamily: font.body700, fontSize: fs.xl }}>{m.title}</T>
              </View>
              {m.pinned && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
                  <Icon name="pin" size={14} color={c.text2} />
                  <T v="smallStrong" tone="text2">
                    Angeheftet
                  </T>
                </View>
              )}
              {m.teaser && (
                <T tone="text2" numberOfLines={2}>
                  {m.teaser}
                </T>
              )}
              <T v="small">
                {m.author} · {fmtDate(m.publishedAt.slice(0, 10))}
              </T>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
