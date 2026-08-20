import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../src/auth/SessionContext';
import { Card, CardGroup, Group, Separator } from '../src/components/Group';
import { Chevron, Row, RowText } from '../src/components/Row';
import { PROFILE_ROWS, SETTINGS_ROWS } from '../src/data/mock';
import { color, layout, type } from '../src/theme';

/** Profil: who you are, which class you were assigned, and the way out. */
export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { identity, role, signOut } = useSession();
  const teacher = role === 'lehrperson';

  async function onSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Zurück"
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        <Text style={styles.backGlyph}>‹</Text>
        <Text style={styles.backLabel}>Portal</Text>
      </Pressable>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{identity.initials}</Text>
        </View>
        <View style={styles.identityText}>
          <Text numberOfLines={1} style={styles.name}>
            {identity.name}
          </Text>
          <Text numberOfLines={1} style={styles.mail}>
            {identity.mail}
          </Text>
        </View>
      </View>

      <CardGroup title={teacher ? 'Anstellung' : 'Ausbildung'}>
        {PROFILE_ROWS[role].map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <Separator />}
            <View style={styles.staticRow}>
              <Text style={[type.body, styles.rowLabel]}>{row.label}</Text>
              <Text numberOfLines={1} style={styles.rowValue}>
                {row.value}
              </Text>
            </View>
          </Fragment>
        ))}
      </CardGroup>

      <CardGroup title="Einstellungen">
        {SETTINGS_ROWS.map((row, index) => (
          <Fragment key={row.label}>
            {index > 0 && <Separator />}
            <Row onPress={() => {}}>
              <Text style={[type.body, styles.rowLabel]}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
              <Chevron />
            </Row>
          </Fragment>
        ))}
      </CardGroup>

      <Group>
        <Card>
          <Row onPress={onSignOut} style={styles.signOutRow}>
            <Text style={styles.signOut}>Abmelden</Text>
          </Row>
        </Card>
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.ground,
  },
  content: {
    paddingBottom: 60,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  backPressed: {
    opacity: 0.5,
  },
  backGlyph: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '400',
    color: color.navy,
  },
  backLabel: {
    fontSize: 17,
    letterSpacing: -0.3,
    color: color.navy,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: layout.groupGap,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 999,
    backgroundColor: color.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 30,
    color: color.ink,
  },
  mail: {
    ...type.secondary,
    marginTop: 3,
  },
  staticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: layout.rowPaddingH,
    paddingVertical: layout.rowPaddingV,
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    ...type.body,
    color: color.inkSecondary,
    flexShrink: 1,
  },
  signOutRow: {
    justifyContent: 'center',
  },
  signOut: {
    ...type.body,
    color: color.red,
  },
});
