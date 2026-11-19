import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { size, sp, useTheme } from "@/theme";
import { fmtShort, getNow } from "@bwd/shared";
import { useOffline } from "@/lib/offline";
import { Banner, Button, T } from "@/ui";
import { AppHeader } from "./AppHeader";

type Props = {
  title?: string;
  back?: { label: string; href?: string };
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  /** Ohne Tab-Bar (z. B. Login), dann weniger Abstand unten */
  noTabs?: boolean;
  scroll?: boolean;
};

/** Bildschirm: Kopfzeile, Titel (H1), scrollbarer Inhalt mit Pull-to-Refresh. */
export function Screen({ title, back, children, onRefresh, refreshing = false, noTabs, scroll = true }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = (noTabs ? insets.bottom : size.tabBar + insets.bottom) + sp[10];
  const offline = useOffline();
  const head = (
    <>
      {title ? (
        <T v="h1" style={{ paddingHorizontal: sp[8], paddingTop: sp[1], paddingBottom: sp[6], fontSize: 30, lineHeight: 32 }}>
          {title}
        </T>
      ) : null}
    </>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <AppHeader back={back} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottom }}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.text2} /> : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {head}
          <View style={{ paddingHorizontal: sp[7] }}>
            {offline.since && <OfflineBanner since={offline.since} onRetry={offline.retry} />}
            {children}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {head}
          {children}
        </View>
      )}
    </View>
  );
}

/** Ohne Verbindung: gespeicherter Stand mit Zeitpunkt. */
function OfflineBanner({ since, onRetry }: { since: string; onRetry: () => void }) {
  const today = getNow().date;
  const stand = since.slice(0, 10) === today ? `von heute ${since.slice(11, 16)}` : `vom ${fmtShort(since.slice(0, 10))} ${since.slice(11, 16)}`;
  return (
    <Banner action={<Button label="Erneut laden" small variant="line" onPress={onRetry} />}>
      <T v="strong" tone="warn">
        Keine Verbindung.
      </T>{" "}
      Du siehst den Stand {stand}.
    </Banner>
  );
}

/** Fehlerzustand mit "Erneut laden". */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="alert" style={{ alignItems: "flex-start", gap: sp[5], padding: sp[7], borderRadius: 18, backgroundColor: c.errBg }}>
      <T v="strong" tone="err">
        {message}
      </T>
      <Button label="Erneut laden" small variant="line" onPress={onRetry} />
    </View>
  );
}
