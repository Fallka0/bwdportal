import { Linking, Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, sp, useTheme } from "@/theme";
import { Icon, SkBox, SkeletonArea, T } from "@/ui";

export default function Links() {
  const { c } = useTheme();
  const l = useApi(() => api.links(), []);
  const groups = [...new Set((l.data?.items ?? []).map((x) => x.group))];
  return (
    <Screen title="Links" back={{ label: "Mehr", href: "/mehr" }} onRefresh={l.refresh} refreshing={l.refreshing}>
      {l.error && !l.data ? (
        <ErrorState message={l.error} onRetry={l.reload} />
      ) : !l.data ? (
        <SkeletonArea label="Links werden geladen">
          <SkBox h={420} />
        </SkeletonArea>
      ) : (
        groups.map((g) => (
          <View key={g} style={{ marginBottom: sp[9], gap: sp[3] }}>
            <T v="smallStrong" tone="text2" accessibilityRole="header">
              {g}
            </T>
            {l.data!.items
              .filter((x) => x.group === g)
              .map((x) => (
                <Pressable key={x.id} accessibilityRole="link" accessibilityLabel={`${x.title} öffnen`} onPress={() => Linking.openURL(x.url)} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[6], padding: sp[5], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : c.panel })}>
                  <View style={{ width: 44, height: 44, borderRadius: radius.l, backgroundColor: x.accent ? c.btn : c.fieldBg, borderWidth: x.accent ? 0 : 1, borderColor: c.rule, alignItems: "center", justifyContent: "center" }}>
                    <T style={{ fontFamily: font.display500, fontSize: fs.m, color: x.accent ? c.btnFg : c.ink }}>{x.badge}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="box">{x.title}</T>
                    {x.sub && <T v="small">{x.sub}</T>}
                  </View>
                  <Icon name="arrow-ur" small color={c.text2} />
                </Pressable>
              ))}
          </View>
        ))
      )}
    </Screen>
  );
}
