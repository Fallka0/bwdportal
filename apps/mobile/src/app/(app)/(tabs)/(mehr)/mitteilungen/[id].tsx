import { fmtLong, fmtSize, parseBody } from "@bwd/shared";
import { useLocalSearchParams } from "expo-router";
import { Linking, Pressable, View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { useMe } from "@/lib/me";
import { storage } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, useTheme } from "@/theme";
import { Icon, SkBox, SkeletonArea, T } from "@/ui";

export default function Article() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const a = useApi(async () => {
    const r = await api.article(String(id));
    void me.refresh();
    return r;
  }, [id]);
  const d = a.data;
  return (
    <Screen back={{ label: "Mitteilungen", href: "/mitteilungen" }} onRefresh={a.refresh} refreshing={a.refreshing}>
      {a.error && !d ? (
        <ErrorState message={a.error} onRetry={a.reload} />
      ) : !d ? (
        <SkeletonArea label="Mitteilung wird geladen">
          <SkBox h={400} />
        </SkeletonArea>
      ) : (
        <View style={{ gap: sp[6], paddingHorizontal: sp[1] }}>
          {d.pinned && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
              <Icon name="pin" size={14} color={c.text2} />
              <T v="smallStrong" tone="text2">
                Angeheftet
              </T>
            </View>
          )}
          <T v="h1" style={{ fontSize: 28, lineHeight: 31 }}>
            {d.title}
          </T>
          <T v="small" style={{ fontSize: fs.m }}>
            {d.author} · {fmtLong(d.publishedAt.slice(0, 10), true)}
          </T>
          {parseBody(d.bodyMd).map((b, i) =>
            b.type === "p" ? (
              <T key={i} style={{ fontSize: fs.l, lineHeight: 24 }}>
                {b.text}
              </T>
            ) : (
              <View key={i} style={{ gap: sp[2] }}>
                {b.items.map((it) => (
                  <View key={it} style={{ flexDirection: "row", gap: sp[3] }}>
                    <T style={{ fontSize: fs.l, lineHeight: 24 }}>•</T>
                    <T style={{ flex: 1, fontSize: fs.l, lineHeight: 24 }}>{it}</T>
                  </View>
                ))}
              </View>
            ),
          )}
          {d.document && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${d.document.title} öffnen, ${fmtSize(d.document.sizeBytes)}`}
              onPress={async () => {
                const t = await storage.get("session");
                Linking.openURL(`${API_URL}/api/v1/files/documents/${d.document!.id}?inline=1${t ? `&t=${encodeURIComponent(t)}` : ""}`);
              }}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[5], padding: sp[6], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : c.panel })}
            >
              <View style={{ width: 40, height: 40, borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule, alignItems: "center", justifyContent: "center" }}>
                <T style={{ fontFamily: font.body700, fontSize: fs.micro, color: c.text2 }}>{d.document.fileType}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T v="strong" style={{ fontFamily: font.body700 }}>
                  {d.document.title}
                </T>
                <T v="small">{fmtSize(d.document.sizeBytes)}</T>
              </View>
              <Icon name="download" />
            </Pressable>
          )}
        </View>
      )}
    </Screen>
  );
}
