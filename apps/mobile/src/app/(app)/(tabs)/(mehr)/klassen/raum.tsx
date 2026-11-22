import { useLocalSearchParams } from "expo-router";
import { ClassroomBody } from "@/classroom/ClassroomBody";
import { Screen } from "@/shell/Screen";

export default function TeacherClassroom() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <Screen title={`Klassenraum ${code}`} back={{ label: code, href: `/klassen/${encodeURIComponent(code)}` }}>
      <ClassroomBody key={code} classCode={code} />
    </Screen>
  );
}
