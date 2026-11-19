import { fmtSize } from "@bwd/shared";
import { useEffect, useState } from "react";
import { Linking, TextInput, View } from "react-native";
import { api, API_URL } from "@/lib/api";
import { storage } from "@/lib/storage";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { font, fs, radius, size, sp, useTheme } from "@/theme";
import { Button, Card, Empty, Icon, IconButton, SkBox, SkeletonArea, T, TextTabs } from "@/ui";

async function openDoc(id: string) {
  const t = await storage.get("session");
  Linking.openURL(`${API_URL}/api/v1/files/documents/${id}?inline=1${t ? `&t=${encodeURIComponent(t)}` : ""}`);
}

export default function Documents() {
  const { c } = useTheme();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("alle");
  useEffect(() => {
    const id = setTimeout(() => setQ(input), 250);
    return () => clearTimeout(id);
  }, [input]);
  const d = useApi(() => api.documents(q, group === "alle" ? undefined : group), [q, group], { cache: "documents" });
  const shown = d.data?.groups.filter((g) => g.items.length) ?? [];
  return (
    <Screen title="Dokumente" back={{ label: "Mehr", href: "/mehr" }} onRefresh={d.refresh} refreshing={d.refreshing}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: sp[4], height: size.touchMin, paddingHorizontal: sp[7], borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule, marginBottom: sp[5] }}>
        <Icon name="search" />
        <TextInput accessibilityLabel="Dokumente suchen" placeholder="Dokumente suchen" placeholderTextColor={c.text3} value={input} onChangeText={setInput} returnKeyType="search" style={{ flex: 1, fontFamily: font.body, fontSize: fs.l, color: c.ink }} />
      </View>
      {d.data && (
        <TextTabs
          label="Kategorie"
          value={group}
          onChange={setGroup}
          items={[{ value: "alle", label: "Alle", count: d.data.total }, ...d.data.groups.map((g) => ({ value: g.name, label: g.name, count: g.total }))]}
        />
      )}
      {d.error && !d.data ? (
        <ErrorState message={d.error} onRetry={d.reload} />
      ) : !d.data ? (
        <SkeletonArea label="Dokumente werden geladen">
          <SkBox h={380} />
        </SkeletonArea>
      ) : shown.length === 0 ? (
        <Empty icon="search" title={q ? `Kein Dokument für «${q}».` : "Keine Dokumente."}>
          <Button
            label="Suche zurücksetzen"
            small
            variant="line"
            onPress={() => {
              setInput("");
              setQ("");
              setGroup("alle");
            }}
          />
        </Empty>
      ) : (
        shown.map((g) => (
          <View key={g.name} style={{ marginBottom: sp[9] }}>
            <T v="smallStrong" tone="text2" accessibilityRole="header" style={{ marginBottom: sp[2] }}>
              {g.name}
            </T>
            <Card pad={sp[7]} style={{ paddingVertical: sp[3] }}>
              {g.items.map((doc, i) => (
                <View key={doc.id} style={{ flexDirection: "row", alignItems: "center", gap: sp[5], paddingVertical: sp[5], borderTopWidth: i ? 1 : 0, borderTopColor: c.rule }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.l, backgroundColor: c.fieldBg, borderWidth: 1, borderColor: c.rule, alignItems: "center", justifyContent: "center" }}>
                    <T style={{ fontFamily: font.body700, fontSize: fs.micro, color: c.text2 }}>{doc.fileType}</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="strong" style={{ fontFamily: font.body700 }}>
                      {doc.title}
                      {doc.isNew ? <T style={{ fontFamily: font.body700, fontSize: fs.xs, color: c.info }}> Neu</T> : null}
                    </T>
                    <T v="small">
                      {fmtSize(doc.sizeBytes)}
                      {doc.note ? ` · ${doc.note}` : ""}
                    </T>
                  </View>
                  <IconButton icon="download" label={`Öffnen: ${doc.title}`} onPress={() => openDoc(doc.id)} />
                </View>
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
