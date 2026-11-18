import { router } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { useMe } from "@/lib/me";
import { Screen } from "@/shell/Screen";
import { sp } from "@/theme";
import { Button, T } from "@/ui";

export default function Profile() {
  const me = useMe();
  const { signOut } = useAuth();
  return (
    <Screen title="Profil" back={{ label: "Mehr", href: "/mehr" }}>
      <View style={{ gap: sp[7] }}>
        <T>{me.data ? `${me.data.name} · ${me.data.classCode} · ${me.data.email}` : ""}</T>
        <Button
          label="Abmelden"
          variant="out"
          icon="logout"
          onPress={async () => {
            await signOut();
            router.replace("/login");
          }}
        />
      </View>
    </Screen>
  );
}
