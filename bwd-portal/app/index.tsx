import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSession } from '../src/auth/SessionContext';
import { color } from '../src/theme';

/** Entry point: send the user to the portal or to sign-in. */
export default function Index() {
  const { loading, signedIn } = useSession();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.navy} />
      </View>
    );
  }

  return <Redirect href={signedIn ? '/(tabs)' : '/sign-in'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.card,
  },
});
