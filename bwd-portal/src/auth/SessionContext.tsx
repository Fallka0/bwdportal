import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { assignClass, roleForMail } from '../data/mock';
import type { Identity, Role } from '../data/types';

const STORAGE_KEY = 'bwd.session';

type StoredSession = {
  identity: Identity;
  refreshToken?: string;
};

type SessionState = {
  /** Null until the stored session has been read back. */
  loading: boolean;
  identity: Identity;
  signedIn: boolean;
  role: Role;
  toggleRole: () => void;
  signIn: (user: { name: string; mail: string; initials: string }, refreshToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const EMPTY_IDENTITY: Identity = {
  name: '',
  mail: '',
  initials: '',
  schoolClass: '',
};

const SessionContext = createContext<SessionState | null>(null);

/** SecureStore has no web implementation; fall back to localStorage there. */
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<Role>('lernende');

  useEffect(() => {
    let cancelled = false;
    storage
      .get(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        const stored = JSON.parse(raw) as StoredSession;
        setIdentity(stored.identity);
        setRole(roleForMail(stored.identity.mail));
        setSignedIn(true);
      })
      .catch(() => {
        // A corrupt or unreadable session just means signing in again.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback<SessionState['signIn']>(async (user, refreshToken) => {
    const next: Identity = {
      ...user,
      // The class comes from the school roster, never from user input.
      schoolClass: assignClass(user.mail),
    };
    setIdentity(next);
    setRole(roleForMail(user.mail));
    setSignedIn(true);
    await storage.set(STORAGE_KEY, JSON.stringify({ identity: next, refreshToken }));
  }, []);

  const signOut = useCallback(async () => {
    setIdentity(EMPTY_IDENTITY);
    setSignedIn(false);
    setRole('lernende');
    await storage.remove(STORAGE_KEY);
  }, []);

  const toggleRole = useCallback(() => {
    setRole((current) => (current === 'lernende' ? 'lehrperson' : 'lernende'));
  }, []);

  const value = useMemo<SessionState>(
    () => ({ loading, identity, signedIn, role, toggleRole, signIn, signOut }),
    [loading, identity, signedIn, role, toggleRole, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return context;
}
