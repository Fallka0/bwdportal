import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { color, layout, type } from '../theme';

const SPRING_EASING = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Bottom sheet used for detail one level below a list. Rises on the same
 * curve the scrim fades on, so the two read as one movement.
 */
export function Sheet({
  visible,
  kicker,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  kicker?: string;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  // Stays mounted through the close animation so it can slide back out.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 420 : 340,
      easing: SPRING_EASING,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, progress]);

  if (!mounted) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Dimensions.get('window').height, 0],
  });

  return (
    // A modal so the sheet covers the floating tab bar, as the design intends.
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View
        style={StyleSheet.absoluteFill}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable style={styles.scrim} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.grabberWrap}>
            <View style={styles.grabber} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerText}>
              {kicker != null && <Text style={styles.kicker}>{kicker}</Text>}
              {title != null && <Text style={styles.title}>{title}</Text>}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Schliessen"
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: color.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '82%',
    backgroundColor: color.ground,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: color.navy,
    shadowOpacity: 0.16,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -12 },
    elevation: 24,
  },
  grabberWrap: {
    paddingTop: 12,
    alignItems: 'center',
  },
  grabber: {
    width: 38,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(11,60,76,.18)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    ...type.sectionHeader,
  },
  title: {
    marginTop: 5,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.9,
    lineHeight: 32,
    color: color.ink,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(11,60,76,.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: {
    transform: [{ scale: 0.9 }],
  },
  closeGlyph: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5F6E74',
  },
  body: {
    paddingHorizontal: layout.gutter,
    paddingTop: 14,
    paddingBottom: 30,
  },
});
