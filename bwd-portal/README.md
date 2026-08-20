# bwd Portal — React Native app

Implementation of the Claude Design prototype in `../project/bwd Portal App.dc.html`.
Expo (SDK 57) + expo-router, TypeScript, iOS / Android / web.

## Running

```bash
npm install
npm start          # then press i / a, or scan with Expo Go
npm run typecheck
```

## Microsoft sign-in

Sign-in is real; everything else is mock data (see below).

Students and staff sign in with their school account
(`vorname.nachname@bwdbern.ch`) through Microsoft Entra ID. The account itself
identifies the person, so nothing is typed in by hand — the class is looked up
from the address after sign-in.

Register a **mobile & desktop** application in the bwd tenant and set:

```bash
cp .env.example .env
# EXPO_PUBLIC_AZURE_CLIENT_ID=<application (client) id>
# EXPO_PUBLIC_AZURE_TENANT_ID=bwdbern.ch
```

The redirect URI to register is `bwdportal://auth` for device builds. In Expo Go
the URI is an `exp://…` address instead — `AuthSession.makeRedirectUri()` prints
the one in use at runtime. Delegated permissions needed: `openid`, `profile`,
`email`, `offline_access`, `User.Read`.

The flow is authorization code + PKCE: `expo-auth-session` obtains the code,
exchanges it for tokens, then reads the signed-in user from Microsoft Graph
(`/me`). The session is persisted with `expo-secure-store` (`localStorage` on
web), so the app opens straight into the portal on the next launch.

**Without a client ID the sign-in screen runs in demo mode** and enters the app
with a placeholder account, so the UI can be reviewed before the Azure app
registration exists.

## What is mocked

Grades, timetable, SOL slots and goals, notices and the class roster all come
from `src/data/mock.ts`, carried over from the prototype. Replace that module
with the school's APIs; the screens read it through plain typed functions.

## Layout

```
app/
  _layout.tsx        session provider + root stack
  index.tsx          redirects to the portal or to sign-in
  sign-in.tsx        Microsoft sign-in
  profile.tsx        profile, settings, sign out
  (tabs)/
    _layout.tsx      shared header + floating tab bar
    index.tsx        Start
    noten.tsx        Noten + exam detail sheet
    plan.tsx         Stundenplan
    sol.tsx          SOL
src/
  theme.ts           colours, type scale, spacing from the prototype
  auth/              Entra ID config, session context
  components/        grouped cards, rows, sheet, tab bar, segmented control
  data/              mock content and its types
```

## Design notes

The visual language follows the final state of the design conversation: a grey
ground (`#F2F2F7`) with white grouped cards, structure from whitespace and
hairlines rather than nested cards, one type scale, and colour only where it
carries meaning — petrol for interactive elements, red for cancellations and the
next exam, green/red for grade movement. Both roles (Lernende and Lehrperson)
are implemented; the switch is in the top-right of every tab.
