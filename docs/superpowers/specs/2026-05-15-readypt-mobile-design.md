# ReadyPT Mobile App — Design Spec

**Goal:** A React Native (Expo) iOS and Android app that delivers the full ReadyPT booking marketplace experience natively — trainers list, booking flow, both dashboards, workout plans, and push notifications — using the same Supabase backend as the web app.

---

## Repository

- **New repo:** `readypt-mobile` (separate from the web app repo)
- **Framework:** Expo managed workflow (TypeScript)
- **Build & submission:** EAS Build (Expo Application Services)
- **Backend:** Same Supabase project (`wnwmlaqhyztwxyvzuqpe`) — no backend changes required

**App store accounts:**
- Apple Developer Program: $99/year
- Google Play Console: $25 one-time

**EAS Build costs:**
- Free tier: 30 builds/month (sufficient for development)
- Pro: $99/month (for production release cadence)

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | Expo SDK (managed workflow) |
| Language | TypeScript |
| Navigation | React Navigation v7 (native stack + bottom tabs) |
| Supabase | `@supabase/supabase-js` |
| Auth session storage | `expo-secure-store` (replaces localStorage) |
| Stripe checkout | `expo-web-browser` (opens Stripe hosted checkout) |
| Deep links | Expo Linking + `readypt://` URI scheme |
| Push notifications | `expo-notifications` + Expo Push API |
| Images | `expo-image` |
| Styling | `StyleSheet.create()` (mirrors inline style objects from web) |

---

## Navigation Structure

### Unauthenticated

```
RootStack
  └── AuthStack (native stack)
        ├── SplashScreen
        └── LoginScreen (client / trainer role toggle)
              ├── ClientSignupScreen
              └── TrainerSignupScreen
```

### Authenticated — Client (bottom tabs)

```
ClientTabs
  ├── Browse tab
  │     └── TrainersListScreen
  │           └── TrainerProfileScreen (slot picker → venue picker → Stripe)
  ├── My Bookings tab
  │     └── ClientDashboardScreen (upcoming + past, venue shown)
  └── Profile tab
        └── ClientProfileScreen (account settings)
```

### Authenticated — Trainer (bottom tabs)

```
TrainerTabs
  ├── Appointments tab
  │     └── AppointmentsScreen (upcoming bookings, client + venue)
  ├── Availability tab
  │     └── AvailabilityScreen (weekly schedule + blocks)
  ├── Plans tab
  │     └── PlansScreen (client plan management + session logging)
  └── Profile tab
        └── TrainerProfileEditScreen (rates, bio, specialties, photo)
```

### Deep Links

| URI | Destination |
|---|---|
| `readypt://booking-confirmed?booking_id=<id>` | `BookingConfirmedScreen` |
| `readypt://booking-cancelled` | Back to `TrainerProfileScreen` with error |

---

## Feature Scope (v1)

### Trainer Listings + Filters
- Region and goal filters persisted in component state (same as web)
- Supabase query identical to web app

### Trainer Profile + Slot Picker
- Slot generation logic (`generateSlots`, `formatSlotSGT`, `formatDateHeader`) ported from `src/utils/slotGenerator.js` — no changes to logic, only import paths

### Venue Picker
- Rewritten as a React Native component using `StyleSheet`
- Same 6 venue types: `condo_gym`, `activesg`, `commercial_gym`, `outdoor`, `home`, `other`
- ActiveSG region → gym cascade using `Picker` (from `@react-native-picker/picker`) or custom modal list
- Free-text types use `TextInput`
- Same `ACTIVESG_GYMS` data, copied into mobile repo

### Stripe Checkout
1. Call `create-checkout` Edge Function (identical to web)
2. Receive `session_url`
3. Open with `expo-web-browser` (`WebBrowser.openBrowserAsync(session_url)`)
4. Stripe redirects to `readypt://booking-confirmed?booking_id=...`
5. App handles deep link, navigates to `BookingConfirmedScreen`

No changes to `create-checkout` Edge Function required.

### Client Dashboard
- Upcoming and past bookings
- Venue name shown below date/time on each card
- Cancel flow (same `cancel-booking` Edge Function)

### Trainer Dashboard
- Upcoming appointments with client name, time, venue
- Appointment status management

### Availability Management
- Weekly recurring schedule editor
- Block-out date picker

### Workout Plans
- Trainer creates/edits plans and assigns to clients
- Client views assigned plan day-by-day
- Session logging (sets, reps, weight) with PR detection
- Progress charts: `react-native-chart-kit` or `victory-native`

### Push Notifications
- **Setup:** On login, call `expo-notifications` to get Expo Push Token, upsert into `profiles.expo_push_token` (new column, migration required)
- **Triggers (sent from Edge Functions):**
  - Client receives "Booking Confirmed" after Stripe webhook
  - Trainer receives "New Booking" when client books
- **Sending:** `notify-booking` Edge Function calls Expo Push API with the token from the booking's trainer/client profile
- **Permissions:** Request on first login; gracefully degrade if denied

---

## Database Changes

One new column required:

```sql
-- Migration 009_expo_push_token.sql
alter table public.profiles
  add column if not exists expo_push_token text;
```

All other schema is unchanged — the mobile app reuses existing tables and Edge Functions.

---

## Auth Flow

1. User enters email + password on `LoginScreen`
2. `supabase.auth.signInWithPassword()` — same as web
3. Session stored in `expo-secure-store` via a custom storage adapter passed to `createClient()`
4. On app launch, session is restored from secure store automatically
5. Role determined from `profiles.role` — routes to `ClientTabs` or `TrainerTabs`

```ts
// supabase client setup (mobile)
import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
})
```

---

## Styling Conventions

- Use `StyleSheet.create()` throughout — mirrors the web app's inline style objects
- Brand tokens as constants: `BG = '#0B1A05'`, `GREEN = '#4ade80'`, `TEXT = '#EEF2EE'`
- Font families: `'var(--font-body)'` becomes the system font or a loaded Expo Google Font
- No third-party UI library — consistent with web app's hand-rolled approach

---

## EAS Build & Submission

```bash
# Install EAS CLI
npm install -g eas-cli

# Login and configure
eas login
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

App Store submission requires:
- Screenshots (6.7" iPhone, 12.9" iPad)
- App description, keywords, privacy policy URL
- Age rating (4+)

---

## Out of Scope (v1)

- In-app messaging between trainer and client
- Apple Pay / Google Pay (handled by Stripe in browser)
- Offline mode
- Apple Watch / Android Wear companion
- Trainer earnings dashboard

---

## Files to Create (new repo: `readypt-mobile`)

```
readypt-mobile/
├── app.json                          # Expo config, bundle IDs, deep link scheme
├── eas.json                          # EAS build profiles
├── src/
│   ├── lib/supabase.ts               # Supabase client with SecureStore adapter
│   ├── hooks/useAuth.tsx             # Auth context (role-based routing)
│   ├── data/activesg-gyms.ts         # Copied from web app
│   ├── utils/slotGenerator.ts        # Ported from web app
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth-gated root
│   │   ├── ClientTabs.tsx            # Bottom tabs for clients
│   │   └── TrainerTabs.tsx           # Bottom tabs for trainers
│   └── screens/
│       ├── auth/LoginScreen.tsx
│       ├── client/
│       │   ├── TrainersListScreen.tsx
│       │   ├── TrainerProfileScreen.tsx
│       │   ├── BookingConfirmedScreen.tsx
│       │   └── ClientDashboardScreen.tsx
│       └── trainer/
│           ├── AppointmentsScreen.tsx
│           ├── AvailabilityScreen.tsx
│           ├── PlansScreen.tsx
│           └── TrainerProfileEditScreen.tsx
└── supabase/migrations/
    └── 009_expo_push_token.sql
```
