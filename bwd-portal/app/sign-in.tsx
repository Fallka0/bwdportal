import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { BwdLockup } from '../src/components/Brand';
import { useSession } from '../src/auth/SessionContext';
import {
  AZURE_CLIENT_ID,
  ISSUER,
  REDIRECT_URI,
  SCOPES,
  fetchGraphIdentity,
  isAuthConfigured,
  nameFromMail,
} from '../src/auth/microsoft';
import { assignClass } from '../src/data/mock';
import { color, type } from '../src/theme';

// Closes the popup window that the auth redirect lands in on web.
WebBrowser.maybeCompleteAuthSession();

type Step = 'form' | 'loading' | 'done';

type PendingUser = { name: string; mail: string; initials: string };

/** Demo identity used when no Azure app is registered yet. */
const DEMO_USER: PendingUser = {
  name: 'Mykyta Test',
  mail: 'mykyta.test@bwdbern.ch',
  initials: 'MT',
};

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useSession();

  const [step, setStep] = useState<Step>('form');
  const [user, setUser] = useState<PendingUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const discovery = AuthSession.useAutoDiscovery(ISSUER);
  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AZURE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  async function onSignIn() {
    if (step === 'loading') return;
    setError(null);
    setStep('loading');

    if (!isAuthConfigured) {
      // Nothing to authenticate against; show the flow with a demo account.
      setUser(DEMO_USER);
      setStep('done');
      return;
    }

    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setStep('form');
        if (result.type === 'error') {
          setError(result.error?.message ?? 'Anmeldung fehlgeschlagen.');
        }
        return;
      }

      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: AZURE_CLIENT_ID,
          code: result.params.code,
          redirectUri: REDIRECT_URI,
          extraParams: request?.codeVerifier
            ? { code_verifier: request.codeVerifier }
            : undefined,
        },
        discovery!,
      );

      const identity = await fetchGraphIdentity(tokens.accessToken);
      setUser({
        ...identity,
        name: identity.name || nameFromMail(identity.mail),
      });
      setStep('done');
    } catch (cause) {
      setStep('form');
      setError(cause instanceof Error ? cause.message : 'Anmeldung fehlgeschlagen.');
    }
  }

  async function onEnter() {
    if (!user) return;
    await signIn(user);
    router.replace('/(tabs)');
  }

  const busy = step === 'loading';
  const canPrompt = !isAuthConfigured || (request != null && discovery != null);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}>
      <BwdLockup size={26} />

      <View style={styles.center}>
        <Text style={styles.title}>
          {step === 'done' ? 'Angemeldet' : 'bwd Portal'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'done'
            ? 'Klasse automatisch zugeteilt.'
            : 'Anmeldung mit deinem Schulkonto.'}
        </Text>

        {step !== 'done' && (
          <>
            <Pressable
              onPress={onSignIn}
              disabled={busy || !canPrompt}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: busy || !canPrompt ? '#9AA3A7' : color.navy },
                pressed && styles.buttonPressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.msMark}>
                  <View style={[styles.msSquare, { backgroundColor: '#F25022' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#7FBA00' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#00A4EF' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#FFB900' }]} />
                </View>
              )}
              <Text style={styles.buttonLabel}>
                {busy ? 'Anmeldung läuft …' : 'Mit Microsoft anmelden'}
              </Text>
            </Pressable>

            {error != null && <Text style={styles.error}>{error}</Text>}
            {!isAuthConfigured && (
              <Text style={styles.hint}>
                Kein Microsoft-Konto konfiguriert — Demo-Modus.
              </Text>
            )}
          </>
        )}

        {step === 'done' && user != null && (
          <>
            <View style={styles.account}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.initials}</Text>
              </View>
              <View style={styles.accountText}>
                <Text numberOfLines={1} style={styles.accountName}>
                  {user.name}
                </Text>
                <Text style={styles.accountClass}>{assignClass(user.mail)}</Text>
              </View>
            </View>
            <Pressable
              onPress={onEnter}
              style={({ pressed }) => [
                styles.button,
                styles.enterButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonLabel}>Zum Portal</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.footer}>bwd Bern · Kaufmännische Berufsschule</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.card,
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  title: {
    ...type.largeTitle,
    lineHeight: 38,
  },
  subtitle: {
    ...type.body,
    color: color.inkSecondary,
    marginTop: 9,
    lineHeight: 25,
  },
  button: {
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  enterButton: {
    marginTop: 14,
    backgroundColor: color.navy,
  },
  buttonPressed: {
    transform: [{ scale: 0.975 }],
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: '#fff',
  },
  msMark: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  msSquare: {
    width: 9,
    height: 9,
  },
  error: {
    ...type.secondary,
    color: color.red,
    marginTop: 14,
  },
  hint: {
    ...type.secondary,
    marginTop: 14,
  },
  account: {
    marginTop: 32,
    padding: 18,
    backgroundColor: color.ground,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: color.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountText: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: color.ink,
  },
  accountClass: {
    ...type.secondary,
    marginTop: 2,
  },
  footer: {
    fontSize: 13,
    letterSpacing: -0.1,
    color: color.inkDisabled,
  },
});
