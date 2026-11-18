import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, type DimensionValue, View } from "react-native";
import { radius, useTheme } from "@/theme";

/** Skeleton: graue Balken, leichtes Pulsieren, bei reduzierter Bewegung statisch. */
export function SkeletonArea({ label, children }: { label: string; children: ReactNode }) {
  const [o] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(o, { toValue: 0.55, duration: 700, useNativeDriver: true }),
          Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [o]);
  return (
    <Animated.View accessible accessibilityLabel={label} accessibilityState={{ busy: true }} style={{ opacity: o }}>
      {children}
    </Animated.View>
  );
}

export function SkLine({ w, h = 12 }: { w: DimensionValue; h?: number }) {
  const { c } = useTheme();
  return <View style={{ width: w, height: h, borderRadius: radius.m, backgroundColor: c.panel2, marginVertical: 6 }} />;
}

export function SkBox({ h, w = "100%", r = radius.xl }: { h: number; w?: DimensionValue; r?: number }) {
  const { c } = useTheme();
  return <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.panel }} />;
}
