# ReadyPT Mobile — Sub-project 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the `readypt-mobile` Expo project with working Supabase auth, role-based bottom-tab navigation, and deep link scheme — the skeleton every future sub-project builds on.

**Architecture:** Separate Expo managed-workflow repo pointing at the same Supabase backend as the web app. Auth uses `expo-secure-store` for session persistence. Navigation uses React Navigation v7: a root stack that switches between an auth stack and role-specific tab bars (ClientTabs / TrainerTabs) based on the user's `profile.role`.

**Tech Stack:** Expo SDK 52, React Navigation v7, `@supabase/supabase-js`, `expo-secure-store`, TypeScript, Jest + `jest-expo` + `@testing-library/react-native`.

---

## Sub-project Map

This is Sub-project 1 of 6 for the ReadyPT mobile app:
1. **Foundation** ← you are here
2. Client Booking Flow (trainers list → profile → slot + venue → Stripe)
3. Dashboards (client dashboard, trainer appointments, cancel flow)
4. Trainer Tools (availability management, trainer profile edit)
5. Client Plans + Progress (plan viewer, session logging, charts)
6. Push Notifications (DB migration, token registration, Edge Function updates)

---

## File Structure

All paths are relative to a new `readypt-mobile/` directory (sibling to `FitnessGuru/`).

```
readypt-mobile/
├── .env                              # EXPO_PUBLIC_SUPABASE_URL + ANON_KEY
├── .env.example                      # Template without real values
├── app.json                          # Expo config — bundle IDs, scheme, name
├── eas.json                          # EAS Build profiles
├── package.json
├── tsconfig.json
├── jest.config.js
├── App.tsx                           # Entry point — wraps with AuthProvider + NavigationContainer
├── src/
│   ├── lib/
│   │   └── supabase.ts               # Supabase client with SecureStore adapter
│   ├── hooks/
│   │   └── useAuth.tsx               # Auth context: session, profile, role, signOut
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth-gated root: AuthStack or role tabs
│   │   ├── AuthStack.tsx             # Login screen stack
│   │   ├── ClientTabs.tsx            # Bottom tabs for clients (3 tabs)
│   │   └── TrainerTabs.tsx           # Bottom tabs for trainers (4 tabs)
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.tsx       # Email + password login
│       ├── client/
│       │   ├── BrowseScreen.tsx      # Placeholder — Sub-project 2
│       │   ├── MyBookingsScreen.tsx  # Placeholder — Sub-project 3
│       │   └── ClientProfileScreen.tsx # Placeholder
│       └── trainer/
│           ├── AppointmentsScreen.tsx  # Placeholder — Sub-project 3
│           ├── AvailabilityScreen.tsx  # Placeholder — Sub-project 4
│           ├── PlansScreen.tsx         # Placeholder — Sub-project 5
│           └── TrainerProfileEditScreen.tsx # Placeholder — Sub-project 4
└── __tests__/
    ├── lib/supabase.test.ts
    ├── hooks/useAuth.test.tsx
    └── navigation/RootNavigator.test.tsx
```

---

### Task 1: Bootstrap Expo project

**Files:**
- Create: `readypt-mobile/` (new directory, created by Expo CLI)

- [ ] **Step 1: Create the Expo project**

Run from your projects root (parent of `FitnessGuru/`):

```bash
npx create-expo-app@latest readypt-mobile --template blank-typescript
```

Expected: a new `readypt-mobile/` directory with `App.tsx`, `package.json`, `tsconfig.json`.

- [ ] **Step 2: Verify it runs**

```bash
cd readypt-mobile
npx expo start
```

Expected: Metro bundler starts, QR code shown. Press `q` to quit.

- [ ] **Step 3: Install all dependencies**

```bash
npx expo install expo-secure-store expo-web-browser expo-image expo-linking expo-notifications
npm install @supabase/supabase-js
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 4: Configure Jest**

Create `jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
}
```

- [ ] **Step 5: Configure TypeScript**

Replace `tsconfig.json` with:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 6: Add src directories**

```bash
mkdir -p src/lib src/hooks src/navigation src/screens/auth src/screens/client src/screens/trainer __tests__/lib __tests__/hooks __tests__/navigation
```

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: bootstrap Expo project with dependencies"
```

---

### Task 2: Environment + Supabase client

**Files:**
- Create: `.env`
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Create: `__tests__/lib/supabase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/supabase.test.ts`:

```ts
import { supabase } from '../../src/lib/supabase'

describe('supabase client', () => {
  it('exports a supabase client', () => {
    expect(supabase).toBeDefined()
    expect(typeof supabase.from).toBe('function')
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/supabase.test.ts
```

Expected: FAIL — module not found or missing env vars.

- [ ] **Step 3: Create .env file**

Create `.env` (copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `../FitnessGuru/.env.local`):

```
EXPO_PUBLIC_SUPABASE_URL=https://wnwmlaqhyztwxyvzuqpe.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste value from FitnessGuru/.env.local>
```

Create `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 4: Create src/lib/supabase.ts**

```ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, key, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 5: Mock expo-secure-store for Jest**

Create `__mocks__/expo-secure-store.js`:

```js
const store = {}
module.exports = {
  getItemAsync: jest.fn((key) => Promise.resolve(store[key] ?? null)),
  setItemAsync: jest.fn((key, value) => { store[key] = value; return Promise.resolve() }),
  deleteItemAsync: jest.fn((key) => { delete store[key]; return Promise.resolve() }),
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx jest __tests__/lib/supabase.test.ts
```

Expected: PASS

- [ ] **Step 7: Add .env to .gitignore**

Append to `.gitignore`:

```
.env
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/supabase.ts __tests__/lib/supabase.test.ts .env.example __mocks__/expo-secure-store.js .gitignore
git commit -m "feat: add Supabase client with SecureStore session adapter"
```

---

### Task 3: useAuth hook

**Files:**
- Create: `src/hooks/useAuth.tsx`
- Create: `__tests__/hooks/useAuth.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `__tests__/hooks/useAuth.test.tsx`:

```tsx
import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import { AuthProvider, useAuth } from '../../src/hooks/useAuth'

// Mock supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn((cb) => {
        cb('INITIAL_SESSION', null)
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      }),
      signOut: jest.fn(() => Promise.resolve()),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null })),
        })),
      })),
    })),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside AuthProvider'
    )
  })

  it('provides null session when not logged in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.session).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('exposes signOut function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(typeof result.current.signOut).toBe('function')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/hooks/useAuth.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/hooks/useAuth.tsx**

```tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  role: 'client' | 'trainer'
  full_name: string | null
  email: string | null
  expo_push_token: string | null
  [key: string]: unknown
}

type AuthContextValue = {
  session: Session | null | undefined
  profile: Profile | null | undefined
  loading: boolean
  role: 'client' | 'trainer' | null
  signOut: () => Promise<void>
  refreshProfile: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined = still initialising | null = no session | Session = logged in
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  // undefined = profile not yet fetched | null = fetched, no row | object = fetched
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)
  const fetchingRef = useRef(false)

  async function fetchProfile(userId: string) {
    fetchingRef.current = true
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data ?? null)
    } catch {
      setProfile(null)
    } finally {
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session ?? null)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loading = session === undefined || (session !== null && profile === undefined)

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    role: (profile?.role ?? null) as 'client' | 'trainer' | null,
    signOut: async () => { await supabase.auth.signOut() },
    refreshProfile: () => { if (session) fetchProfile(session.user.id) },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/hooks/useAuth.test.tsx
```

Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAuth.tsx __tests__/hooks/useAuth.test.tsx
git commit -m "feat: add useAuth hook with role-based session management"
```

---

### Task 4: LoginScreen

**Files:**
- Create: `src/screens/auth/LoginScreen.tsx`

*(No unit test — integration tested manually via Expo Go. Navigation integration test in Task 5.)*

- [ ] **Step 1: Create src/screens/auth/LoginScreen.tsx**

```tsx
import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

const BG = '#0B1A05'
const GREEN = '#4ade80'
const TEXT = '#EEF2EE'
const DIM = 'rgba(238,242,238,0.5)'
const BORDER = 'rgba(238,242,238,0.15)'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    }
    // On success: onAuthStateChange fires → AuthProvider updates session → RootNavigator re-routes
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>ReadyPT</Text>
        <Text style={styles.subtitle}>Singapore's Personal Training Marketplace</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={DIM}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={DIM}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={BG} />
            : <Text style={styles.buttonText}>LOG IN</Text>
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontWeight: '800', fontSize: 36, color: TEXT, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: DIM, marginBottom: 40 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#f87171', fontSize: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, color: TEXT, fontSize: 15, marginBottom: 12 },
  button: { backgroundColor: GREEN, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: BG, fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx
git commit -m "feat: add LoginScreen with email/password auth"
```

---

### Task 5: Placeholder screens + navigation skeleton

**Files:**
- Create: `src/screens/client/BrowseScreen.tsx`
- Create: `src/screens/client/MyBookingsScreen.tsx`
- Create: `src/screens/client/ClientProfileScreen.tsx`
- Create: `src/screens/trainer/AppointmentsScreen.tsx`
- Create: `src/screens/trainer/AvailabilityScreen.tsx`
- Create: `src/screens/trainer/PlansScreen.tsx`
- Create: `src/screens/trainer/TrainerProfileEditScreen.tsx`
- Create: `src/navigation/AuthStack.tsx`
- Create: `src/navigation/ClientTabs.tsx`
- Create: `src/navigation/TrainerTabs.tsx`
- Create: `src/navigation/RootNavigator.tsx`
- Modify: `App.tsx`
- Create: `__tests__/navigation/RootNavigator.test.tsx`

- [ ] **Step 1: Create all placeholder screens**

Each placeholder follows this exact pattern. Create all 7 files:

`src/screens/client/BrowseScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function BrowseScreen() {
  return <View style={s.c}><Text style={s.t}>Browse — coming in Sub-project 2</Text></View>
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' }, t: { color: 'rgba(238,242,238,0.4)', fontSize: 14 } })
```

`src/screens/client/MyBookingsScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function MyBookingsScreen() {
  return <View style={s.c}><Text style={s.t}>My Bookings — coming in Sub-project 3</Text></View>
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' }, t: { color: 'rgba(238,242,238,0.4)', fontSize: 14 } })
```

`src/screens/client/ClientProfileScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
export default function ClientProfileScreen() {
  const { signOut, profile } = useAuth()
  return (
    <View style={s.c}>
      <Text style={s.name}>{profile?.full_name ?? 'Client'}</Text>
      <Pressable style={s.btn} onPress={signOut}><Text style={s.btnTxt}>Sign Out</Text></Pressable>
    </View>
  )
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center', gap: 16 }, name: { color: '#EEF2EE', fontSize: 18, fontWeight: '700' }, btn: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }, btnTxt: { color: '#f87171', fontWeight: '600' } })
```

`src/screens/trainer/AppointmentsScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function AppointmentsScreen() {
  return <View style={s.c}><Text style={s.t}>Appointments — coming in Sub-project 3</Text></View>
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' }, t: { color: 'rgba(238,242,238,0.4)', fontSize: 14 } })
```

`src/screens/trainer/AvailabilityScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function AvailabilityScreen() {
  return <View style={s.c}><Text style={s.t}>Availability — coming in Sub-project 4</Text></View>
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' }, t: { color: 'rgba(238,242,238,0.4)', fontSize: 14 } })
```

`src/screens/trainer/PlansScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
export default function PlansScreen() {
  return <View style={s.c}><Text style={s.t}>Plans — coming in Sub-project 5</Text></View>
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' }, t: { color: 'rgba(238,242,238,0.4)', fontSize: 14 } })
```

`src/screens/trainer/TrainerProfileEditScreen.tsx`:
```tsx
import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
export default function TrainerProfileEditScreen() {
  const { signOut, profile } = useAuth()
  return (
    <View style={s.c}>
      <Text style={s.name}>{profile?.full_name ?? 'Trainer'}</Text>
      <Pressable style={s.btn} onPress={signOut}><Text style={s.btnTxt}>Sign Out</Text></Pressable>
    </View>
  )
}
const s = StyleSheet.create({ c: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center', gap: 16 }, name: { color: '#EEF2EE', fontSize: 18, fontWeight: '700' }, btn: { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }, btnTxt: { color: '#f87171', fontWeight: '600' } })
```

- [ ] **Step 2: Write failing navigation test**

Create `__tests__/navigation/RootNavigator.test.tsx`:

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { NavigationContainer } from '@react-navigation/native'
import RootNavigator from '../../src/navigation/RootNavigator'

// Mock useAuth to return unauthenticated state
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ session: null, profile: null, loading: false, role: null, signOut: jest.fn(), refreshProfile: jest.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('../../src/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}))

describe('RootNavigator', () => {
  it('shows LoginScreen when not authenticated', async () => {
    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    )
    expect(screen.getByPlaceholderText('Email')).toBeTruthy()
    expect(screen.getByPlaceholderText('Password')).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest __tests__/navigation/RootNavigator.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create src/navigation/AuthStack.tsx**

```tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/auth/LoginScreen'

export type AuthStackParamList = {
  Login: undefined
}

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 5: Create src/navigation/ClientTabs.tsx**

```tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import BrowseScreen from '../screens/client/BrowseScreen'
import MyBookingsScreen from '../screens/client/MyBookingsScreen'
import ClientProfileScreen from '../screens/client/ClientProfileScreen'

export type ClientTabsParamList = {
  Browse: undefined
  MyBookings: undefined
  ClientProfile: undefined
}

const Tab = createBottomTabNavigator<ClientTabsParamList>()

const TAB_BAR_STYLE = {
  backgroundColor: '#0d1a0e',
  borderTopColor: 'rgba(238,242,238,0.08)',
}

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: 'rgba(238,242,238,0.4)',
      }}
    >
      <Tab.Screen name="Browse" component={BrowseScreen} options={{ title: 'Browse' }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Tab.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 6: Create src/navigation/TrainerTabs.tsx**

```tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AppointmentsScreen from '../screens/trainer/AppointmentsScreen'
import AvailabilityScreen from '../screens/trainer/AvailabilityScreen'
import PlansScreen from '../screens/trainer/PlansScreen'
import TrainerProfileEditScreen from '../screens/trainer/TrainerProfileEditScreen'

export type TrainerTabsParamList = {
  Appointments: undefined
  Availability: undefined
  Plans: undefined
  TrainerProfile: undefined
}

const Tab = createBottomTabNavigator<TrainerTabsParamList>()

const TAB_BAR_STYLE = {
  backgroundColor: '#0d1a0e',
  borderTopColor: 'rgba(238,242,238,0.08)',
}

export default function TrainerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarActiveTintColor: '#4ade80',
        tabBarInactiveTintColor: 'rgba(238,242,238,0.4)',
      }}
    >
      <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: 'Appointments' }} />
      <Tab.Screen name="Availability" component={AvailabilityScreen} options={{ title: 'Availability' }} />
      <Tab.Screen name="Plans" component={PlansScreen} options={{ title: 'Plans' }} />
      <Tab.Screen name="TrainerProfile" component={TrainerProfileEditScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 7: Create src/navigation/RootNavigator.tsx**

```tsx
import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../hooks/useAuth'
import AuthStack from './AuthStack'
import ClientTabs from './ClientTabs'
import TrainerTabs from './TrainerTabs'

export default function RootNavigator() {
  const { session, loading, role } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4ade80" size="large" />
      </View>
    )
  }

  if (!session) return <AuthStack />
  if (role === 'trainer') return <TrainerTabs />
  return <ClientTabs />
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0B1A05', alignItems: 'center', justifyContent: 'center' },
})
```

- [ ] **Step 8: Update App.tsx**

Replace the entire contents of `App.tsx`:

```tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/hooks/useAuth'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 9: Run navigation test to verify it passes**

```bash
npx jest __tests__/navigation/RootNavigator.test.tsx
```

Expected: PASS

- [ ] **Step 10: Run all tests**

```bash
npx jest
```

Expected: all tests pass (supabase, useAuth, RootNavigator).

- [ ] **Step 11: Commit**

```bash
git add src/navigation/ src/screens/ App.tsx __tests__/navigation/
git commit -m "feat: add navigation skeleton with role-based routing and placeholder screens"
```

---

### Task 6: app.json + EAS configuration

**Files:**
- Modify: `app.json`
- Create: `eas.json`

- [ ] **Step 1: Update app.json**

Replace `app.json` with the following (update `<your-apple-team-id>` once you have the Apple Developer account):

```json
{
  "expo": {
    "name": "ReadyPT",
    "slug": "readypt",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0B1A05"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.readypt.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0B1A05"
      },
      "package": "com.readypt.app",
      "versionCode": 1
    },
    "scheme": "readypt",
    "plugins": [
      "expo-secure-store",
      "expo-notifications"
    ]
  }
}
```

- [ ] **Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Install EAS CLI globally**

```bash
npm install -g eas-cli
eas login
```

Expected: prompts for Expo account login. Use or create an account at expo.dev (free).

- [ ] **Step 4: Configure EAS for the project**

```bash
eas build:configure
```

Expected: creates the EAS project ID in `app.json` under `expo.extra.eas.projectId`.

- [ ] **Step 5: Verify full test suite still passes**

```bash
npx jest
```

Expected: all tests pass.

- [ ] **Step 6: Final commit**

```bash
git add app.json eas.json
git commit -m "chore: configure app.json with bundle IDs, deep link scheme, and EAS build profiles"
```

---

## Verification

After all tasks complete, run the app on a physical device or simulator:

```bash
# iOS simulator (macOS only)
npx expo run:ios

# Android emulator
npx expo run:android

# Physical device via Expo Go (quickest)
npx expo start
```

**Expected behaviour:**
1. App opens on a dark green splash screen
2. LoginScreen shows: "ReadyPT" heading, email input, password input, LOG IN button
3. Enter valid credentials from the Supabase database
4. On success: client sees 3-tab bar (Browse / My Bookings / Profile), trainer sees 4-tab bar (Appointments / Availability / Plans / Profile)
5. Tapping Profile → Sign Out returns to LoginScreen

---

## Next Sub-project

Sub-project 2 (Client Booking Flow) builds on this foundation:
- `TrainersListScreen` — lists trainers from Supabase, filters by region/goal
- `TrainerProfileScreen` — slot picker (ported from web), VenuePicker (RN rewrite), Stripe via `expo-web-browser`
- `BookingConfirmedScreen` — deep-link target from `readypt://booking-confirmed`
