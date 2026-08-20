import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { color, layout, type } from '../theme';

/** Grey caps label that sits above a card, as in grouped iOS lists. */
export function SectionHeader({ children }: { children: ReactNode }) {
  return <Text style={styles.header}>{children}</Text>;
}

/** White rounded surface holding one or more rows. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * A labelled group: caps header, the caller's surface beneath it, and the
 * standing gap to the next group. The surface is passed in so a group can hold
 * a plain `Card`, a `PressableCard`, or anything else.
 */
export function Group({
  title,
  children,
  style,
}: {
  title?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.group, style]}>
      {title != null && <SectionHeader>{title}</SectionHeader>}
      {children}
    </View>
  );
}

/** Group whose body is a single card of rows — the common case. */
export function CardGroup({
  title,
  children,
  style,
}: {
  title?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <Group title={title}>
      <Card style={style}>{children}</Card>
    </Group>
  );
}

/** Hairline between rows — omitted above the first row of a card. */
export function Separator({ strong = false }: { strong?: boolean }) {
  return (
    <View
      style={[styles.separator, { backgroundColor: strong ? color.separatorStrong : color.separator }]}
    />
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: layout.groupGap,
  },
  header: {
    ...type.sectionHeader,
    marginBottom: 7,
    paddingHorizontal: layout.gutter,
  },
  card: {
    backgroundColor: color.card,
    borderRadius: layout.cardRadius,
    marginHorizontal: layout.gutter,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
});
