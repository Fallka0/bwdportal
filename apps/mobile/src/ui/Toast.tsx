import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";
import { radius, size, sp, useTheme } from "@/theme";
import { IconButton } from "./Button";
import { Icon } from "./Icon";
import { T } from "./Text";

const Ctx = createContext<{ show: (t: string) => void }>({ show: () => {} });
export const useToast = () => useContext(Ctx);

/** Toast über der Tab-Bar, ein Satz, verschwindet von selbst, wird vorgelesen. */
export function ToastProvider({ children, bottomOffset = size.tabBar + 40 }: { children: ReactNode; bottomOffset?: number }) {
  const { c } = useTheme();
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((t: string) => {
    setText(t);
    AccessibilityInfo.announceForAccessibility(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(""), 5000);
  }, []);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {text ? (
        <View accessibilityLiveRegion="polite" style={{ position: "absolute", left: sp[7], right: sp[7], bottom: bottomOffset, flexDirection: "row", alignItems: "center", gap: sp[4], paddingLeft: sp[7], paddingRight: sp[1], paddingVertical: sp[1], borderRadius: radius.xl, backgroundColor: c.btn }}>
          <Icon name="check" small color={c.btnFg} />
          <T v="strong" style={{ flex: 1, color: c.btnFg }}>
            {text}
          </T>
          <IconButton icon="x" label="Meldung schliessen" color={c.btnFg} onPress={() => setText("")} />
        </View>
      ) : null}
    </Ctx.Provider>
  );
}
