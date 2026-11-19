import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, sp, useTheme } from "@/theme";
import { IconButton } from "./Button";
import { T } from "./Text";

/**
 * Sheet von unten (Absenz entschuldigen, Einplanen, Portfolio-Eintrag).
 * Schliessen über X, Tippen auf den Hintergrund oder nach unten ziehen.
 */
export function Sheet({ open, onClose, title, children, actions }: { open: boolean; onClose: () => void; title: string; children: ReactNode; actions?: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(600));

  useEffect(() => {
    if (!open) return;
    y.setValue(600);
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) y.setValue(0);
      else Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  }, [open, y]);

  const pan = useMemo(
    () =>
      PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) y.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1) onClose();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
      },
      }),
    [onClose, y],
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable accessibilityLabel="Schliessen" accessibilityRole="button" onPress={onClose} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim }} />
        <Animated.View
          accessibilityViewIsModal
          style={{ transform: [{ translateY: y }], backgroundColor: c.bg, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, maxHeight: "92%", paddingBottom: Math.max(insets.bottom, sp[9]) }}
        >
          <View {...pan.panHandlers} style={{ paddingTop: sp[3], alignItems: "center" }}>
            <View style={{ width: 36, height: 5, borderRadius: radius.pill, backgroundColor: c.ruleStrong }} />
          </View>
          <View {...pan.panHandlers} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: sp[8], paddingTop: sp[4] }}>
            <T v="h2" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 29 }}>
              {title}
            </T>
            <IconButton icon="x" label="Schliessen" onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: sp[8], paddingTop: sp[6], gap: sp[6] }}>
            {children}
            {actions && <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: sp[3], flexWrap: "wrap", marginTop: sp[2] }}>{actions}</View>}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
