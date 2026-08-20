import { ReactNode, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { color, layout, type } from '../theme';

/**
 * Press feedback is applied on press-in, not on release, so every surface
 * answers the finger immediately.
 */
function usePressScale(to: number) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  return {
    scale,
    onPressIn: () => animate(to),
    onPressOut: () => animate(1),
  };
}

/** Whole card that scales slightly when pressed. */
export function PressableCard({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.985);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={!onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/** List row inside a card; highlights rather than scales. */
export function Row({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? { backgroundColor: color.rowPressed } : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Title over optional grey subtitle, both clipped to a single line. */
export function RowText({
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
}: {
  title: string;
  subtitle?: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.rowTextWrap}>
      <Text numberOfLines={1} style={[type.body, titleStyle]}>
        {title}
      </Text>
      {subtitle != null && subtitle !== '' && (
        <Text numberOfLines={1} style={[type.secondary, styles.subtitle, subtitleStyle]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

export function Chevron({ rotated = false }: { rotated?: boolean }) {
  return (
    <Text style={[styles.chevron, rotated && styles.chevronRotated]}>›</Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.rowPaddingH,
    paddingVertical: layout.rowPaddingV,
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    marginTop: 2,
  },
  chevron: {
    fontSize: 17,
    color: color.chevron,
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
});
