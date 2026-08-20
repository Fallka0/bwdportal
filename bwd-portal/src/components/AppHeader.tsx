import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '../auth/SessionContext';
import { color } from '../theme';
import { BwdLockup } from './Brand';

/**
 * Sticky top chrome shared by every tab: the bwd lockup on the left, the
 * role switch on the right. Tapping the avatar opens the profile.
 */
export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { role, toggleRole, identity } = useSession();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <BwdLockup size={17} />
      <View style={styles.trailing}>
        <Pressable
          onPress={toggleRole}
          style={({ pressed }) => [styles.switch, pressed && styles.switchPressed]}
        >
          <Text style={styles.roleLabel}>
            {role === 'lehrperson' ? 'Lehrperson' : 'Lernende'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
        >
          <Text style={styles.avatarText}>{identity.initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: color.ground,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: color.tint,
  },
  switchPressed: {
    backgroundColor: 'rgba(11,60,76,.12)',
    transform: [{ scale: 0.96 }],
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: color.navy,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: color.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressed: {
    transform: [{ scale: 0.92 }],
  },
  avatarText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
