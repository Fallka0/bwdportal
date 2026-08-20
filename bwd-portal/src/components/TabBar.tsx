import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color } from '../theme';

/**
 * Each tab gets its own primitive so the glyphs stay distinguishable:
 * a house, ascending bars, a calendar grid, and two open book halves.
 */
const GLYPHS: Record<string, string> = {
  index: 'M4 11.4 13 4.5l9 6.9V21a1 1 0 0 1-1 1h-5.5v-6h-5v6H5a1 1 0 0 1-1-1z',
  noten: 'M5 21V13m6.5 8V6.5M18 21v-5.5',
  plan: 'M4.5 7.5h17v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1zM4.5 12h17M8.5 4.5v4m9-4v4',
  sol: 'M5 5.5h5.5A2.5 2.5 0 0 1 13 8v13a2 2 0 0 0-2-2H5zm16 0h-5.5A2.5 2.5 0 0 0 13 8v13a2 2 0 0 1 2-2h6z',
};

/** Floating translucent capsule with a pill behind the active tab. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}
    >
      <BlurView intensity={40} tint="light" style={styles.capsule}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tab,
                focused && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Svg width={24} height={24} viewBox="0 0 26 26" fill="none">
                <Path
                  d={GLYPHS[route.name]}
                  stroke={focused ? color.navy : '#8A9499'}
                  strokeWidth={focused ? 2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text
                style={[
                  styles.label,
                  { color: focused ? color.navy : '#8A9499' },
                  focused && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  capsule: {
    flexDirection: 'row',
    gap: 2,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    // The blur alone reads too thin over white cards; a wash keeps contrast.
    backgroundColor: 'rgba(255,255,255,.72)',
    ...Platform.select({
      ios: {
        shadowColor: '#111517',
        shadowOpacity: 0.14,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tab: {
    width: 74,
    alignItems: 'center',
    gap: 3,
    paddingTop: 6,
    paddingBottom: 4,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: color.tintStrong,
  },
  tabPressed: {
    transform: [{ scale: 0.92 }],
  },
  label: {
    fontSize: 10.5,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: '600',
  },
});
