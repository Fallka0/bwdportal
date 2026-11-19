import { router } from "expo-router";
import { View } from "react-native";
import { Screen } from "@/shell/Screen";
import { font, sp, useTheme } from "@/theme";
import { Button, T } from "@/ui";

export default function NotFound() {
  const { c } = useTheme();
  return (
    <Screen back={{ label: "Übersicht", href: "/" }} noTabs>
      <View style={{ paddingTop: 40, paddingHorizontal: sp[1], gap: sp[6] }}>
        <T style={{ fontFamily: font.display, fontSize: 84, lineHeight: 84, letterSpacing: -5, color: c.ruleStrong }} accessibilityElementsHidden>
          404
        </T>
        <T v="h1" style={{ fontSize: 32, lineHeight: 34 }}>
          Diese Seite gibt es nicht.
        </T>
        <T tone="text2" style={{ fontSize: 16, lineHeight: 24 }}>
          Vielleicht wurde der Link geändert oder die Seite ist nicht mehr im Portal.
        </T>
        <View style={{ gap: sp[3], marginTop: sp[3] }}>
          <Button label="Zur Übersicht" icon="home" wide onPress={() => router.replace("/")} />
          <Button label="Stundenplan" variant="line" wide onPress={() => router.replace("/stundenplan")} />
          <Button label="Dokumente" variant="line" wide onPress={() => router.replace("/dokumente")} />
        </View>
      </View>
    </Screen>
  );
}
