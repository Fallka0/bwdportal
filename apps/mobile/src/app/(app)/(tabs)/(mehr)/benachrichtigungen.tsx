import { fmtWeekdayShort, notificationGroup } from "@bwd/shared";
import type { IconName } from "@bwd/shared/icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, radius, sp, useTheme } from "@/theme";
import { Button, Empty, Icon, SkBox, SkeletonArea, T } from "@/ui";

const ORDER = ["Heute", "Gestern", "Diese Woche", "Früher"] as const;

export default function Notifications() {
  const { c } = useTheme();
  const me = useMe();
  const n = useApi(() => api.notifications(), []);
  const clock = useApi(() => api.home(), []);
  const [busy, setBusy] = useState(false);
  const today = clock.data?.today;
  const unread = n.data?.items.some((x) => x.unread);
  const refresh = async () => {
    await Promise.all([n.refresh(), me.refresh()]);
  };
  return (
    <Screen title="Benachrichtigungen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={refresh} refreshing={n.refreshing}>
      {unread && (
        <Button
          label="Alle als gelesen markieren"
          variant="ghost"
          small
          icon="check"
          busy={busy}
          style={{ marginBottom: sp[5] }}
          onPress={async () => {
            setBusy(true);
            await api.markAllRead().catch(() => {});
            await refresh();
            setBusy(false);
          }}
        />
      )}
      {n.error && !n.data ? (
        <ErrorState message={n.error} onRetry={n.reload} />
      ) : !n.data || !today ? (
        <SkeletonArea label="Benachrichtigungen werden geladen">
          <SkBox h={420} />
        </SkeletonArea>
      ) : n.data.items.length === 0 ? (
        <Empty icon="bell" title="Keine Benachrichtigungen." />
      ) : (
        ORDER.map((g) => {
          const list = n.data!.items.filter((x) => notificationGroup(x.createdAt, today) === g);
          if (!list.length) return null;
          return (
            <View key={g} style={{ marginBottom: sp[8] }}>
              <T v="smallStrong" tone="text2" accessibilityRole="header" style={{ marginBottom: sp[3] }}>
                {g}
              </T>
              {list.map((x) => (
                <Pressable
                  key={x.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${x.unread ? "Neu: " : ""}${x.title}. ${x.body ?? ""}`}
                  onPress={async () => {
                    if (x.unread) await api.markRead([x.id]).catch(() => {});
                    void refresh();
                    if (x.href) router.navigate(x.href as never);
                  }}
                  style={({ pressed }) => ({ flexDirection: "row", gap: sp[5], padding: sp[5], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : x.unread ? c.panel : "transparent" })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule, alignItems: "center", justifyContent: "center" }}>
                    <Icon name={x.icon as IconName} small color={x.kind === "warn" ? c.warn : x.kind === "ok" ? c.ok : c.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="strong" style={{ fontFamily: font.body700 }}>
                      {x.title}
                    </T>
                    {x.body && <T v="small">{x.body}</T>}
                  </View>
                  <T v="small">{g === "Heute" || g === "Gestern" ? x.createdAt.slice(11, 16) : fmtWeekdayShort(x.createdAt.slice(0, 10))}</T>
                </Pressable>
              ))}
            </View>
          );
        })
      )}
    </Screen>
  );
}
