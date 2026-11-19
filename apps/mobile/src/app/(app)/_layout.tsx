import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { MeProvider } from "@/lib/me";
import { useTheme } from "@/theme";

/** Geschützter Bereich: ohne Session zum Login. */
export default function AppLayout() {
  const { status } = useAuth();
  const { c } = useTheme();
  if (status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (status === "out") return <Redirect href="/login" />;
  return (
    <MeProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />
    </MeProvider>
  );
}
