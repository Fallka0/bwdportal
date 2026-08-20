import { Redirect, Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSession } from '../../src/auth/SessionContext';
import { AppHeader } from '../../src/components/AppHeader';
import { TabBar } from '../../src/components/TabBar';
import { color } from '../../src/theme';

export default function TabsLayout() {
  const { loading, signedIn } = useSession();

  if (loading) return null;
  if (!signedIn) return <Redirect href="/sign-in" />;

  return (
    <View style={styles.root}>
      <AppHeader />
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: color.ground },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Start' }} />
        <Tabs.Screen name="noten" options={{ title: 'Noten' }} />
        <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
        <Tabs.Screen name="sol" options={{ title: 'SOL' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.ground,
  },
});
