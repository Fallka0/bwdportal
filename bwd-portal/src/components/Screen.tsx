import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { color, layout, type } from '../theme';

/**
 * Standard tab screen: grey ground, a large title, then grouped cards,
 * scrolling clear of the floating tab bar.
 */
export function Screen({
  title,
  subtitle,
  belowTitle,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Controls that sit between the title and the first group. */
  belowTitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.titleBlock}>
        <Text style={type.largeTitle}>{title}</Text>
        {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {belowTitle}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: color.ground,
  },
  content: {
    paddingBottom: layout.tabBarClearance,
  },
  titleBlock: {
    paddingHorizontal: 20,
    paddingBottom: layout.groupGap,
  },
  subtitle: {
    ...type.body,
    color: color.inkSecondary,
    marginTop: 4,
  },
});
