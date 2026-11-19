import { getNow, layoutGrid, tokens, type GridInput, type PlacedBlock } from "@bwd/shared";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { font, fs, radius, sp, useTheme } from "@/theme";
import { Icon, T } from "@/ui";

type Nav = { onPress: () => void; label: string };

type Props = {
  grid: Omit<GridInput, "now">;
  now: { date: string; time: string };
  live: boolean;
  title: string;
  sub?: string;
  prev?: Nav;
  next?: Nav;
  aside?: ReactNode;
  today?: Nav;
  variant: "day" | "week" | "sol";
};

const AX = tokens.timeGrid.axisWidthApp;

/** Das eine Zeitraster der App, gleiche Rechnung wie im Web (@bwd/shared). */
export function TimeGrid({ grid, now: initialNow, live, title, sub, prev, next, aside, today, variant }: Props) {
  const { c } = useTheme();
  const [ticked, setTicked] = useState<{ date: string; time: string } | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const n = getNow();
      setTicked({ date: n.date, time: n.time });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [live]);

  // Mit DEMO_NOW gilt die Zeit vom Server; sonst tickt die Uhr jede Minute.
  const now = live && ticked ? ticked : initialNow;
  const g = layoutGrid({ ...grid, now });
  const colGap = variant === "week" ? 3 : sp[2];
  const axGap = sp[2];
  const inner = Math.max(0, width - AX - axGap);
  const totalW = g.columns.reduce((s, col) => s + (col.weight ?? 1), 0);
  const free = inner - colGap * (g.columns.length - 1);
  const cols: { col: (typeof g.columns)[number]; left: number; width: number }[] = [];
  for (const col of g.columns) {
    const prevCol = cols[cols.length - 1];
    const left = prevCol ? prevCol.left + prevCol.width + colGap : 0;
    cols.push({ col, left, width: (free * (col.weight ?? 1)) / totalW });
  }
  const multi = g.columns.length > 1;

  return (
    <View style={{ backgroundColor: c.panel, borderRadius: radius.xl, padding: sp[5] }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: sp[6] }}>
        <View style={{ width: aside ? 64 : 44 }}>{prev && <NavBtn icon="chev-l" {...prev} />}</View>
        <View style={{ flex: 1, alignItems: "center" }}>
          <T accessibilityRole="header" accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ fontFamily: font.display400, fontSize: variant === "sol" ? fs.h3 + 1 : fs.h2, letterSpacing: -0.7, lineHeight: 26 }}>
            {title}
          </T>
          {sub && <T style={{ fontSize: fs.base }}>{sub}</T>}
          {today && (
            <Pressable accessibilityRole="button" onPress={today.onPress} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}>
              <T v="label">{today.label}</T>
            </Pressable>
          )}
        </View>
        <View style={{ width: aside ? 64 : 44, alignItems: "flex-end" }}>{aside ?? (next && <NavBtn icon="chev-r" {...next} />)}</View>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {multi && width > 0 && (
          <View style={{ height: 34, borderBottomWidth: 1, borderBottomColor: c.rule, marginBottom: sp[4] }} importantForAccessibility="no-hide-descendants">
            {cols.map(({ col, left, width: w }) => (
              <View key={col.key} style={{ position: "absolute", left: AX + axGap + left, width: w, top: 0 }}>
                <T style={{ fontFamily: font.body700, fontSize: variant === "week" ? fs.micro : fs.s, color: col.today && variant === "week" ? c.ink : c.text2 }}>
                  {col.header}
                  {variant === "week" ? "\n" : " "}
                  {col.headerNum}
                </T>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: g.height }}>
          {g.hours.map((h) => (
            <View key={h.label} pointerEvents="none">
              <T style={{ position: "absolute", left: 0, top: h.top, fontFamily: font.body600, fontSize: fs.xs, color: c.text2 }} importantForAccessibility="no">
                {h.label}
              </T>
              <View style={{ position: "absolute", left: AX + axGap, right: 0, top: h.top, height: 1, backgroundColor: c.rule }} />
            </View>
          ))}
          {g.lunch && (
            <View style={{ position: "absolute", left: AX + axGap, right: 0, top: g.lunch.top, height: g.lunch.height, borderRadius: radius.m, backgroundColor: c.panel2, alignItems: "center", justifyContent: "center" }} importantForAccessibility="no-hide-descendants">
              <T style={{ fontFamily: font.body600, fontSize: fs.xs, color: c.text2 }}>Mittag</T>
            </View>
          )}
          {width > 0 &&
            cols.map(({ col, left, width: w }) => (
              <View key={col.key} accessibilityRole="list" accessibilityLabel={col.header} style={{ position: "absolute", left: AX + axGap + left, width: w, top: 0, bottom: 0 }}>
                {col.blocks.map((b) => (
                  <Block key={b.id} b={b} lanes={col.lanes} width={w} variant={variant} />
                ))}
              </View>
            ))}
          {g.now && (
            <View accessible accessibilityLabel={`Jetzt ${g.now.label}`} pointerEvents="none" style={{ position: "absolute", left: AX + axGap, right: 0, top: g.now.top - 1, height: 2, backgroundColor: c.now, zIndex: 3 }}>
              <View style={{ position: "absolute", right: "100%", marginRight: 4, top: -8, height: 18, paddingHorizontal: 3, borderRadius: radius.xs, backgroundColor: c.now, justifyContent: "center" }}>
                <T style={{ fontFamily: font.body700, fontSize: fs.micro, color: c.frame }}>{g.now.label}</T>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function NavBtn({ icon, onPress, label }: Nav & { icon: "chev-l" | "chev-r" }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      <Icon name={icon} />
    </Pressable>
  );
}

function Block({ b, lanes, width, variant }: { b: PlacedBlock; lanes?: number; width: number; variant: Props["variant"] }) {
  const { c } = useTheme();
  const grey = b.kind === "cancelled" || b.kind === "sol" || b.kind === "presence";
  const bg = grey ? c.panel2 : b.past ? c.ttPast : c.ttBg;
  const fg = grey ? c.ink : c.ttFg;
  const week = variant === "week";
  const laneW = lanes ? width / lanes : width;
  const left = lanes && b.lane !== undefined ? b.lane * laneW : 0;
  const w = lanes ? laneW - 3 : width;
  const short = week || b.kind === "presence";
  const title = short && b.titleShort && b.kind !== "sol" ? b.titleShort : b.title;
  const sub = short && b.subShort !== undefined && b.kind !== "sol" ? b.subShort : b.sub;
  const subColor = b.kind === "changed" ? c.ttChanged : b.kind === "cancelled" ? c.err : grey ? c.text2 : fg;
  const small = week || b.kind === "presence";
  const inline = !week && b.kind !== "presence" && b.kind !== "plan";
  return (
    <View
      accessible
      accessibilityLabel={b.label}
      style={{ position: "absolute", top: b.top, height: b.height, left, width: w, borderRadius: week ? radius.s : radius.m, backgroundColor: bg, paddingVertical: small ? 4 : 6, paddingHorizontal: small ? 5 : 10, overflow: "hidden" }}
    >
      <View style={{ flexDirection: inline || (b.kind === "plan" && b.compact) ? "row" : "column", alignItems: inline ? "baseline" : "flex-start", gap: inline ? sp[3] : 1 }}>
        <T numberOfLines={1} ellipsizeMode={week ? "clip" : "tail"} style={{ fontFamily: font.body700, fontSize: small ? fs.xs : fs.m, color: b.kind === "cancelled" ? c.text2 : fg, textDecorationLine: b.kind === "cancelled" ? "line-through" : "none" }}>
          {title}
        </T>
        {!!sub && (
          <T numberOfLines={1} style={{ fontFamily: b.kind === "changed" || b.kind === "cancelled" ? font.body700 : font.body, fontSize: small ? fs.micro : fs.s, color: subColor, opacity: b.kind === "lesson" || b.kind === "plan" ? 0.85 : 1, flexShrink: 1 }}>
            {sub}
          </T>
        )}
      </View>
      {!!b.detail && b.kind === "plan" && !b.compact && !week && (
        <T numberOfLines={1} style={{ fontSize: fs.s, color: fg, opacity: 0.85 }}>
          {b.detail}
        </T>
      )}
      {!week && b.kind !== "presence" && !(b.kind === "plan" && b.medium) && (
        <T style={{ fontSize: fs.xs, color: grey ? c.text2 : fg, opacity: grey ? 1 : b.past ? 0.85 : 0.6 }}>{b.timeLabel}</T>
      )}
    </View>
  );
}

/** Legende unter der Wochenansicht. */
export function TimeGridLegend() {
  const { c } = useTheme();
  const item = (mark: ReactNode, label: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: sp[2] }}>
      {mark}
      <T v="small">{label}</T>
    </View>
  );
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[7], marginTop: sp[6] }} importantForAccessibility="no-hide-descendants">
      {item(<View style={{ width: 14, height: 2, backgroundColor: c.now }} />, "Jetzt")}
      {item(<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.live }} />, "Raumänderung")}
      {item(<View style={{ width: 12, height: 12, borderRadius: radius.xs, backgroundColor: c.panel2, borderWidth: 1, borderColor: c.ruleStrong }} />, "Entfällt")}
    </View>
  );
}
