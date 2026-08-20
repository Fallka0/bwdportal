import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color } from '../theme';

export type Segment = {
  label: string;
  /** A full slot cannot be selected and reads as disabled. */
  disabled?: boolean;
};

/** Inset segmented control: the active segment is a raised white pill. */
export function SegmentedControl({
  segments,
  selectedIndex,
  onChange,
  tabularValues = false,
}: {
  segments: Segment[];
  selectedIndex: number;
  onChange: (index: number) => void;
  tabularValues?: boolean;
}) {
  return (
    <View style={styles.track}>
      {segments.map((segment, index) => {
        const active = index === selectedIndex && !segment.disabled;
        return (
          <Pressable
            key={segment.label}
            onPress={() => !segment.disabled && onChange(index)}
            disabled={segment.disabled}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[
                styles.label,
                tabularValues && styles.tabular,
                active ? styles.labelActive : null,
                segment.disabled ? styles.labelDisabled : null,
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    backgroundColor: color.segmentTrack,
    borderRadius: 11,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: color.card,
    shadowColor: color.navy,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: color.inkSecondary,
  },
  labelActive: {
    fontWeight: '600',
    color: color.ink,
  },
  labelDisabled: {
    color: color.inkDisabled,
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
