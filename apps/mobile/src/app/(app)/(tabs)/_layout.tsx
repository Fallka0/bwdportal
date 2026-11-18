import { TabList, Tabs, TabSlot, TabTrigger } from "expo-router/ui";
import { TabBarView, TabButton, TABS } from "@/shell/TabBar";

/**
 * Vier Tabs. Unterseiten liegen im Stack des jeweiligen Tabs, die Tab-Bar bleibt sichtbar.
 * TabList und TabTrigger müssen hier direkt stehen: Tabs liest sie aus dem JSX.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBarView>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href as never} asChild>
              <TabButton label={t.label} icon={t.icon} withBadge={t.name === "(mehr)"} />
            </TabTrigger>
          ))}
        </TabBarView>
      </TabList>
    </Tabs>
  );
}
