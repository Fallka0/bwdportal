import { fmtBytes, fmtLong, type ClassFile } from "@bwd/shared";
import { ApiFailure } from "@bwd/shared/api";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { api } from "@/lib/api";
import { openApiFile } from "@/lib/files";
import { useApi } from "@/lib/useApi";
import { ErrorState } from "@/shell/Screen";
import { radius, sp, useTheme } from "@/theme";
import { Button, Card, Empty, Icon, SelectField, SkBox, SkeletonArea, T, TextField, useToast } from "@/ui";

const when = (stamp: string) => `${fmtLong(stamp.slice(0, 10))}, ${stamp.slice(11, 16)}`;

function FileRow({ f }: { f: ClassFile }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${f.name} öffnen`}
      onPress={() => openApiFile(`/files/class/${encodeURIComponent(f.id)}`)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: sp[4], padding: sp[4], borderRadius: radius.l, backgroundColor: pressed ? c.panel2 : c.bg, minHeight: 44 })}
    >
      <Icon name="file" small />
      <View style={{ flex: 1 }}>
        <T v="strong" numberOfLines={1}>
          {f.name}
        </T>
        <T v="small">{[f.subject?.name, fmtBytes(f.bytes)].filter(Boolean).join(" · ")}</T>
      </View>
    </Pressable>
  );
}

/** Klassenraum: Lernende ohne Klasse (eigene), Lehrpersonen mit classCode; schreiben nur, wer darf. */
export function ClassroomBody({ classCode }: { classCode?: string }) {
  const toast = useToast();
  const r = useApi(() => api.classroom(classCode), [classCode], { cache: `classroom-${classCode ?? "mine"}` });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const d = r.data;
  if (r.error && !d) return <ErrorState message={r.error} onRetry={r.reload} />;
  if (!d)
    return (
      <SkeletonArea label="Klassenraum wird geladen">
        <SkBox h={240} />
      </SkeletonArea>
    );
  const options = d.canPostFor.map((o) => ({ value: o.code ?? "", label: o.name }));
  const chosen = subject || options[0]?.value || "";

  async function send() {
    setBusy(true);
    setError("");
    try {
      await api.createClassPost({ classCode: d!.classCode, subject: chosen || null, body, fileIds: [] });
      setBody("");
      toast.show("Beitrag gesendet.");
      await r.refresh();
    } catch (e) {
      setError(e instanceof ApiFailure ? e.message : "Senden fehlgeschlagen. Versuche es nochmals.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: sp[5] }}>
      {options.length > 0 && (
        <Card>
          <View style={{ gap: sp[4] }}>
            {options.length > 1 && <SelectField label="Für" value={chosen} options={options} onChange={setSubject} />}
            <TextField label="Beitrag" value={body} maxLength={5000} multiline editable={!busy} onChangeText={setBody} />
            {!!error && (
              <T v="smallStrong" tone="err" accessibilityRole="alert">
                {error}
              </T>
            )}
            <Button label="Senden" icon="send" wide busy={busy} disabled={!body.trim()} onPress={send} />
          </View>
        </Card>
      )}
      {d.posts.length === 0 ? (
        <Empty icon="msg" title="Noch keine Beiträge." />
      ) : (
        d.posts.map((p) => (
          <Card key={p.id}>
            <View style={{ gap: sp[3] }}>
              <View>
                <T v="strong">{p.author}</T>
                <T v="small">{[p.subject?.name ?? "Ganze Klasse", when(p.createdAt), p.edited ? "bearbeitet" : null].filter(Boolean).join(" · ")}</T>
              </View>
              <T>{p.body}</T>
              {p.files.map((f) => (
                <FileRow key={f.id} f={f} />
              ))}
              {p.canDelete && (
                <Button
                  label="Löschen"
                  variant="ghost"
                  small
                  icon="trash"
                  style={{ alignSelf: "flex-start" }}
                  onPress={async () => {
                    await api.deleteClassPost(p.id).catch(() => null);
                    await r.refresh();
                  }}
                />
              )}
            </View>
          </Card>
        ))
      )}
      {d.files.length > 0 && (
        <Card>
          <T v="box" style={{ marginBottom: sp[4] }}>
            Dateien
          </T>
          <View style={{ gap: sp[2] }}>
            {d.files.map((f) => (
              <FileRow key={f.id} f={f} />
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}
