import { StyleSheet, Text, View } from 'react-native';
import { color } from '../theme';

/**
 * The bwd lockup — `b(wd`, tightly set, with the parenthesis lighter and
 * optically nudged down against the two bold halves.
 */
export function BwdLockup({ size = 17 }: { size?: number }) {
  return (
    <View style={styles.lockup}>
      <Text style={[styles.bold, { fontSize: size }]}>b</Text>
      <Text
        style={[
          styles.paren,
          { fontSize: size * 1.12, transform: [{ translateY: size * 0.06 }] },
        ]}
      >
        (
      </Text>
      <Text style={[styles.bold, { fontSize: size }]}>wd</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  bold: {
    fontWeight: '700',
    letterSpacing: -0.4,
    color: color.navy,
  },
  paren: {
    fontWeight: '300',
    color: color.navy,
  },
});
