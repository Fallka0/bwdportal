import * as AuthSession from 'expo-auth-session';
import type { Identity } from '../data/types';

/**
 * Microsoft Entra ID (Azure AD) sign-in for bwd school accounts. Students and
 * staff use their personal school address (vorname.nachname@bwdbern.ch), so the
 * account itself identifies the person — nothing is typed in by hand.
 */

export const AZURE_CLIENT_ID = process.env.EXPO_PUBLIC_AZURE_CLIENT_ID ?? '';
export const AZURE_TENANT_ID = process.env.EXPO_PUBLIC_AZURE_TENANT_ID ?? 'bwdbern.ch';

/** Without a registered app there is nothing to sign in against. */
export const isAuthConfigured = AZURE_CLIENT_ID !== '';

export const ISSUER = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`;

export const SCOPES = ['openid', 'profile', 'email', 'offline_access', 'User.Read'];

export const REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'bwdportal',
  path: 'auth',
});

const GRAPH_ME = 'https://graph.microsoft.com/v1.0/me';

type GraphUser = {
  displayName?: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
};

/** Reads the signed-in user straight from Microsoft Graph. */
export async function fetchGraphIdentity(accessToken: string): Promise<{
  name: string;
  mail: string;
  initials: string;
}> {
  const response = await fetch(GRAPH_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Microsoft Graph antwortete mit ${response.status}`);
  }
  const user = (await response.json()) as GraphUser;
  const mail = user.mail ?? user.userPrincipalName ?? '';
  const name = user.displayName ?? nameFromMail(mail);
  return { name, mail, initials: initialsFor(user, name) };
}

function initialsFor(user: GraphUser, name: string): string {
  if (user.givenName && user.surname) {
    return (user.givenName[0] + user.surname[0]).toUpperCase();
  }
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** `mykyta.test@bwdbern.ch` → `Mykyta Test`, used when Graph omits a name. */
export function nameFromMail(mail: string): string {
  const local = mail.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export type { Identity };
