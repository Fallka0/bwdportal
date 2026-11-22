import { ClassroomBody } from "@/classroom/ClassroomBody";
import { useMe } from "@/lib/me";
import { Screen } from "@/shell/Screen";

export default function Classroom() {
  const me = useMe();
  return (
    <Screen title="Klassenraum" back={{ label: "Mehr", href: "/mehr" }}>
      <ClassroomBody key={me.data?.classCode ?? ""} />
    </Screen>
  );
}
