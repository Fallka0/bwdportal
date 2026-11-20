import { config, microsoftLogo, type DemoAccount } from "@bwd/shared";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { font, fs, radius, size, sp, tracking, useTheme } from "@/theme";
import { Banner, Icon, Sheet, T } from "@/ui";

type Methods = { mock: boolean; microsoft: boolean; planary: boolean };

export default function Login() {
  const { c } = useTheme();
  const { status, signIn, signInWith } = useAuth();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccount[] | null>(null);
  const [foreign, setForeign] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [methods, setMethods] = useState<Methods | null>(null);
  // Mit welchem Anbieter der letzte Versuch lief (für "Anderes Planary-Konto verwenden")
  const [lastProvider, setLastProvider] = useState<"microsoft" | "planary" | null>(null);

  useEffect(() => {
    api
      .authConfig()
      .then(setMethods)
      .catch(() => setFailure("Das Portal ist nicht erreichbar. Versuche es nochmals."));
  }, []);

  if (status === "in") return <Redirect href="/" />;

  async function login(provider: "microsoft" | "planary", mode?: "signup" | "switch") {
    setOpen(false);
    setFailure("");
    setForeign(false);
    setLastProvider(provider);
    const r = await signInWith(provider, mode);
    if (r.ok) router.replace("/");
    else if (!("cancelled" in r)) {
      if (r.foreign) setForeign(true);
      else setFailure(r.message);
    }
  }

  async function openDemo() {
    setFailure("");
    setOpen(true);
    try {
      setAccounts((await api.accounts()).accounts);
    } catch {
      setOpen(false);
      setFailure("Das Portal ist nicht erreichbar. Versuche es nochmals.");
    }
  }

  async function choose(id: string) {
    setBusy(id);
    const r = await signIn(id);
    setBusy(null);
    setOpen(false);
    if (r.ok) router.replace("/");
    else if (r.foreign) setForeign(true);
    else setFailure(r.message);
  }

  const m = methods;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + sp[8], paddingBottom: insets.bottom + sp[9], paddingHorizontal: sp[9] }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[4] }}>
        <View style={{ width: 30, height: 30, borderRadius: radius.m, backgroundColor: c.btn, alignItems: "center", justifyContent: "center" }}>
          <T style={{ fontFamily: font.display600, fontSize: 9, color: c.btnFg }}>bwd</T>
        </View>
        <T style={{ fontFamily: font.display400, fontSize: fs.xl, letterSpacing: tracking(fs.xl) }}>Portal</T>
      </View>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <T v="h1" style={{ fontSize: 40, lineHeight: 40, letterSpacing: -2 }}>
          Alles für die Schule an einem Ort.
        </T>
        {foreign && (
          <Banner tone="err">
            <T v="strong" tone="err">
              Dieses Konto gehört nicht zur bwd.
            </T>{" "}
            Melde dich mit deiner Adresse {config.school.emailPattern} an.
          </Banner>
        )}
        {foreign && lastProvider === "planary" && <LoginButton label="Anderes Planary-Konto verwenden" onPress={() => login("planary", "switch")} />}
        {!!failure && <Banner tone="err">{failure}</Banner>}
        {m?.planary && <LoginButton label="Mit Planary-Konto anmelden" primary onPress={() => login("planary")} />}
        {m?.microsoft && <LoginButton label="Mit Microsoft anmelden" microsoft primary={!m.planary} onPress={() => login("microsoft")} />}
        {m?.mock && <LoginButton label="Demo-Konto wählen" primary={!m.planary && !m.microsoft} onPress={openDemo} />}
        {m && !m.planary && !m.microsoft && !m.mock && <Banner tone="err">Die Anmeldung ist noch nicht eingerichtet.</Banner>}
        {m?.planary && (
          <Pressable accessibilityRole="link" onPress={() => login("planary", "signup")} hitSlop={8} style={{ minHeight: size.touchMin, justifyContent: "center", alignSelf: "flex-start" }}>
            <T style={{ fontFamily: font.body600, fontSize: fs.m, textDecorationLine: "underline" }}>Planary-Konto erstellen</T>
          </Pressable>
        )}
        <T v="small" style={{ fontSize: fs.m }}>
          {config.school.emailPattern}
        </T>
      </View>
      <View style={{ flexDirection: "row", gap: sp[7] }}>
        <T v="small">Hilfe bei der Anmeldung</T>
        <T v="small">Datenschutz</T>
      </View>

      <Sheet open={open} onClose={() => setOpen(false)} title="Demo-Konto wählen">
        {(accounts ?? []).map((a) => (
          <AccountRow key={a.id} title={a.name} sub={`${a.classCode ?? ""} · ${a.email}`} initials={a.name.split(" ").map((p) => p[0]).join("")} busy={busy === a.id} onPress={() => choose(a.id)} />
        ))}
        <AccountRow title="Anderes Microsoft-Konto" sub="Nicht von der bwd" busy={busy === "foreign"} onPress={() => choose("foreign")} />
        <T v="small">Demo-Modus</T>
      </Sheet>
    </View>
  );
}

function LoginButton({ label, primary, microsoft, onPress }: { label: string; primary?: boolean; microsoft?: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: radius.xl,
        backgroundColor: primary ? (pressed ? c.btnHover : c.btn) : "transparent",
        borderWidth: primary ? 0 : 1,
        borderColor: c.ruleStrong,
        flexDirection: "row",
        alignItems: "center",
        gap: sp[6],
        paddingHorizontal: sp[8],
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {microsoft && (
        <View style={{ width: 20, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
          {microsoftLogo.map((col) => (
            <View key={col} style={{ width: 9, height: 9, backgroundColor: col }} />
          ))}
        </View>
      )}
      <T style={{ fontFamily: font.body600, fontSize: fs.l, color: primary ? c.btnFg : c.ink }}>{label}</T>
    </Pressable>
  );
}

function AccountRow({ title, sub, initials, busy, onPress }: { title: string; sub: string; initials?: string; busy: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${sub}`} accessibilityState={{ busy }} onPress={onPress} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[6], minHeight: 64, padding: sp[6], borderRadius: radius.xl, backgroundColor: pressed ? c.panel2 : c.panel })}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: initials ? c.btn : c.panel2, alignItems: "center", justifyContent: "center" }}>
        {initials ? <T style={{ fontFamily: font.display400, fontSize: 11, color: c.btnFg }}>{initials}</T> : <Icon name="user" small />}
      </View>
      <View style={{ flex: 1 }}>
        <T v="strong">{title}</T>
        <T v="small">{sub}</T>
      </View>
      <Icon name="chev-r" small color={c.text2} />
      <View style={{ position: "absolute", width: size.touchMin }} />
    </Pressable>
  );
}
