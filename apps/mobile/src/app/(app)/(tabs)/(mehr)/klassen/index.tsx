import { plural } from "@bwd/shared";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { ErrorState, Screen } from "@/shell/Screen";
import { Card, Empty, ListRow, SkBox, SkeletonArea, T } from "@/ui";

export default function Classes() {
  const c = useApi(() => api.classes(), [], { cache: "classes" });
  return (
    <Screen title="Klassen" back={{ label: "Mehr", href: "/mehr" }} onRefresh={c.refresh} refreshing={c.refreshing}>
      {c.error && !c.data ? (
        <ErrorState message={c.error} onRetry={c.reload} />
      ) : !c.data ? (
        <SkeletonArea label="Klassen werden geladen">
          <SkBox h={160} />
        </SkeletonArea>
      ) : c.data.classes.length === 0 ? (
        <Empty icon="users" title="Dir sind noch keine Klassen zugeteilt." />
      ) : (
        <Card>
          {c.data.classes.map((k, i) => (
            <ListRow
              key={k.code}
              first={i === 0}
              title={k.code}
              sub={[k.subjects.map((s) => s.name).join(", "), plural(k.students, "Lernende Person", "Lernende")].filter(Boolean).join(" · ")}
              end={k.classTeacher ? <T v="small">Klassenlehrperson</T> : undefined}
              onPress={() => router.push(`/klassen/${encodeURIComponent(k.code)}`)}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
