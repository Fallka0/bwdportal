import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { useMe } from "@/lib/me";
import { TabBarView, TabButton, TABS, TEACHER_TABS } from "@/shell/TabBar";

/**
 * Vier Tabs. Unterseiten liegen im Stack des jeweiligen Tabs, die Tab-Bar bleibt sichtbar.
 * TabList und TabTrigger müssen hier direkt stehen: Tabs liest sie aus dem JSX.
 */
export default function TabsLayout() {
  const tabs = useMe().data?.role === "teacher" ? TEACHER_TABS : TABS;
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBarView>
          {tabs.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href as never} asChild>
              <TabButton label={t.label} icon={t.icon} withBadge={t.name === "(mehr)"} />
            </TabTrigger>
          ))}
        </TabBarView>
      </TabList>
    </Tabs>
  );
}
