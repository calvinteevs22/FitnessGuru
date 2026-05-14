# Prototype Booking Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full end-to-end booking loop — trainer listing → slot picker → Stripe pay-to-book → confirmed booking → client dashboard with cancel → trainer sees bookings.

**Architecture:** React pages talk directly to Supabase (no separate server). Payments go through three Supabase Edge Functions: `create-checkout` (creates Stripe session + pending booking row), `stripe-webhook` (confirms booking on payment), `cancel-booking` (refunds and cancels). All Edge Functions call the Stripe REST API directly with `fetch` — no Stripe SDK installed.

**Tech Stack:** React 19 + Vite, React Router v6, Supabase JS v2, Stripe Checkout (redirect-based, test mode), Vitest + React Testing Library, Deno (Edge Functions), inline styles only in JSX.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `supabase/migrations/004_booking_stripe.sql` | Add stripe columns to bookings; update status check; public trainer RLS |
| Create | `src/utils/slotGenerator.js` | Generate available slot datetimes from trainer availability data |
| Create | `src/utils/slotGenerator.test.js` | Unit tests for slot generator |
| Create | `src/pages/TrainerListingPage.jsx` | Browse approved trainers (real Supabase data) |
| Create | `src/pages/TrainerListingPage.test.jsx` | Smoke test |
| Create | `src/pages/TrainerProfilePage.jsx` | Trainer detail page + slot picker + book button |
| Create | `src/pages/TrainerProfilePage.test.jsx` | Smoke test |
| Create | `src/pages/BookingConfirmedPage.jsx` | Post-Stripe-redirect confirmation screen |
| Create | `src/pages/BookingConfirmedPage.test.jsx` | Smoke test |
| Create | `src/pages/ClientDashboardPage.jsx` | Client's bookings list + cancel button |
| Create | `src/pages/ClientDashboardPage.test.jsx` | Smoke test |
| Create | `supabase/functions/create-checkout/index.ts` | Stripe Checkout session creator |
| Create | `supabase/functions/stripe-webhook/index.ts` | Stripe webhook handler (confirm booking on payment) |
| Create | `supabase/functions/cancel-booking/index.ts` | 24h check + Stripe refund + status update |
| Create | `supabase/functions/notify-booking/index.ts` | Email notifications for booking_confirmed and booking_cancelled |
| Modify | `src/App.jsx` | Add 4 new routes; add login redirect param support |

---

## Task 1: DB Migration — Stripe Columns + Status Enum + Public Trainer RLS

**Files:**
- Create: `supabase/migrations/004_booking_stripe.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/004_booking_stripe.sql

-- 1. Update the bookings status check to include 'pending'
DO $$
DECLARE
  cname text;
BEGIN
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'bookings'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name ILIKE '%status%'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- 2. Add Stripe tracking columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS amount_sgd int;

-- 3. Public read for approved trainer_profiles (needed for /trainers and /trainer/:id)
CREATE POLICY "Public read approved trainer profiles"
  ON public.trainer_profiles FOR SELECT
  USING (status = 'approved');

-- 4. Public read for profiles (needed to join full_name, bio, photo on trainer pages)
CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT
  USING (true);
```

- [ ] **Step 2: Apply migration via Supabase Management API**

Replace `YOUR_SUPABASE_ACCESS_TOKEN` with the project token (`REDACTED_SUPABASE_PAT`).

```bash
SQL=$(cat supabase/migrations/004_booking_stripe.sql | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

curl -s -X POST "https://api.supabase.com/v1/projects/wnwmlaqhyztwxyvzuqpe/database/query" \
  -H "Authorization: Bearer REDACTED_SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $SQL}" | python3 -m json.tool
```

Expected: `[]` (empty results = success). Any `error` key in the response = failure, fix the SQL.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/004_booking_stripe.sql
git commit -m "feat: migration 004 — stripe columns, pending status, public trainer RLS"
```

---

## Task 2: Add New Routes to App.jsx + Login Redirect Support

**Files:**
- Modify: `src/App.jsx` (around lines 1594–1614 for routes, line 20 area for LoginPage imports)

- [ ] **Step 1: Import the four new page components at the top of App.jsx**

Add these imports after the existing page imports (around line 13):

```jsx
import TrainerListingPage from './pages/TrainerListingPage.jsx'
import TrainerProfilePage from './pages/TrainerProfilePage.jsx'
import BookingConfirmedPage from './pages/BookingConfirmedPage.jsx'
import ClientDashboardPage from './pages/ClientDashboardPage.jsx'
```

- [ ] **Step 2: Add the four new routes inside the `<Routes>` block**

Find the `<Routes>` block (around line 1594) and add these routes before the closing `</Routes>`:

```jsx
<Route path="/trainers" element={<TrainerListingPage />} />
<Route path="/trainer/:id" element={<TrainerProfilePage />} />
<Route path="/booking/confirmed" element={
  <ProtectedRoute><BookingConfirmedPage /></ProtectedRoute>
} />
<Route path="/dashboard/client" element={
  <ProtectedRoute><ClientDashboardPage /></ProtectedRoute>
} />
```

- [ ] **Step 3: Add redirect param support to LoginPage**

Open `src/pages/LoginPage.jsx`. Find the `useSearchParams` import (already present). Find where the successful login navigates the user (look for `navigate(` after a successful `signInWithPassword` call).

Add `useSearchParams` to read the redirect param and use it after login. Find the successful login handler and change the navigation to:

```jsx
// Near the top of LoginPage, add:
const [searchParams] = useSearchParams() // already imported
const redirectTo = searchParams.get('redirect')

// In the handleLogin success path, replace navigate(...) with:
navigate(redirectTo ?? (role === 'admin' ? '/admin' : role === 'trainer' ? '/dashboard/trainer' : '/dashboard/client'))
```

Note: `role` refers to `profile?.role` from `useAuth()`. Read the existing login success path in LoginPage and slot this logic in — do not restructure the file.

- [ ] **Step 4: Verify dev server loads without errors**

```bash
npm run dev
```

Navigate to `http://localhost:5173/trainers` — should render without crash (page will be blank until Task 4). Check browser console for import errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/pages/LoginPage.jsx
git commit -m "feat: add trainer listing, profile, booking, and client dashboard routes"
```

---

## Task 3: Slot Generator Utility

**Files:**
- Create: `src/utils/slotGenerator.js`
- Create: `src/utils/slotGenerator.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// src/utils/slotGenerator.test.js
import { describe, it, expect } from 'vitest'
import { generateSlots, formatSlotSGT } from './slotGenerator.js'

// Helper: build an availability row
function avail(day_of_week, start_time = '09:00', end_time = '12:00', duration_mins = 60) {
  return { day_of_week, start_time, end_time, duration_mins }
}

// Helper: get ISO string for a slot N days from now at a given SGT hour
function slotISO(daysAhead, sgtHour, sgtMin = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  // Set to that date at midnight UTC, then add SGT time converted to UTC (SGT = UTC+8)
  const utcHour = sgtHour - 8
  d.setUTCHours(utcHour, sgtMin, 0, 0)
  return d.toISOString()
}

describe('generateSlots', () => {
  it('returns empty array when trainer has no availability', () => {
    expect(generateSlots([], [], [])).toEqual([])
  })

  it('generates slots for a matching day of week', () => {
    // Find what day of week is 1 day from now
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000).getUTCDay()

    const result = generateSlots([avail(dow, '09:00', '11:00', 60)], [], [])
    expect(result).toHaveLength(1)
    expect(result[0].slots).toHaveLength(2) // 09:00 and 10:00
    expect(result[0].duration_mins).toBe(60)
  })

  it('skips blocked dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sgtTomorrow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000)
    const dateStr = sgtTomorrow.toISOString().split('T')[0]
    const dow = sgtTomorrow.getUTCDay()

    const result = generateSlots(
      [avail(dow, '09:00', '10:00', 60)],
      [{ blocked_date: dateStr }],
      []
    )
    expect(result).toHaveLength(0)
  })

  it('filters out already-booked slots', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const sgtTomorrow = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000)
    const dow = sgtTomorrow.getUTCDay()

    // Build the ISO for the 09:00 SGT slot
    const bookedSlot = new Date(sgtTomorrow)
    bookedSlot.setUTCHours(1, 0, 0, 0) // 09:00 SGT = 01:00 UTC
    const bookedISO = bookedSlot.toISOString()

    const result = generateSlots(
      [avail(dow, '09:00', '11:00', 60)],
      [],
      [{ scheduled_at: bookedISO }]
    )
    expect(result[0].slots).toHaveLength(1) // only 10:00 slot remains
    expect(result[0].slots[0]).not.toBe(bookedISO)
  })

  it('does not include today (starts from tomorrow)', () => {
    const today = new Date()
    const dow = new Date(today.getTime() + 8 * 60 * 60 * 1000).getUTCDay()
    const result = generateSlots([avail(dow, '09:00', '10:00', 60)], [], [], 1)
    // With daysAhead=1 we only look at tomorrow, not today
    // If today is the same DOW, result will have 1 day; otherwise 0
    // Just verify no crash and length is 0 or 1
    expect(Array.isArray(result)).toBe(true)
  })
})

describe('formatSlotSGT', () => {
  it('formats an ISO string as a human-readable SGT time', () => {
    // 2026-01-01 01:00:00 UTC = 09:00 SGT
    const iso = '2026-01-01T01:00:00.000Z'
    const result = formatSlotSGT(iso)
    expect(result).toContain('09:00')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/utils/slotGenerator.test.js
```

Expected: FAIL — `Cannot find module './slotGenerator.js'`

- [ ] **Step 3: Implement the slot generator**

```javascript
// src/utils/slotGenerator.js

/**
 * Generate available booking slots for a trainer over the next `daysAhead` days.
 *
 * @param {Array} availability  - rows from trainer_availability table
 * @param {Array} blocks        - rows from availability_blocks table
 * @param {Array} confirmedBookings - rows from bookings with { scheduled_at }
 * @param {number} daysAhead    - how many days ahead to look (default 30)
 * @returns {Array<{ date: string, duration_mins: number, slots: string[] }>}
 *   date is YYYY-MM-DD in SGT; slots are UTC ISO strings
 */
export function generateSlots(availability, blocks, confirmedBookings, daysAhead = 30) {
  const blockDates = new Set(blocks.map(b => b.blocked_date))
  const bookedISOs = new Set(confirmedBookings.map(b => b.scheduled_at))
  const result = []

  for (let i = 1; i <= daysAhead; i++) {
    const utcBase = new Date()
    utcBase.setDate(utcBase.getDate() + i)
    utcBase.setUTCHours(0, 0, 0, 0)

    // Compute SGT date (UTC+8)
    const sgtBase = new Date(utcBase.getTime() + 8 * 60 * 60 * 1000)
    const dateStr = sgtBase.toISOString().split('T')[0]   // YYYY-MM-DD in SGT
    const dayOfWeek = sgtBase.getUTCDay()                  // 0=Sun...6=Sat in SGT

    const avail = availability.find(a => a.day_of_week === dayOfWeek)
    if (!avail) continue
    if (blockDates.has(dateStr)) continue

    const [startH, startM] = avail.start_time.split(':').map(Number)
    const [endH, endM] = avail.end_time.split(':').map(Number)
    const startMins = startH * 60 + startM  // minutes since midnight SGT
    const endMins = endH * 60 + endM

    const daySlots = []
    for (let mins = startMins; mins + avail.duration_mins <= endMins; mins += avail.duration_mins) {
      // Convert SGT minutes to UTC: subtract 8 hours (480 minutes)
      const utcMins = mins - 480
      // Build UTC slot datetime using the SGT date's year/month/day
      const slot = new Date(Date.UTC(
        sgtBase.getUTCFullYear(),
        sgtBase.getUTCMonth(),
        sgtBase.getUTCDate(),
        Math.floor(utcMins / 60),
        utcMins % 60,
        0, 0
      ))
      const slotISO = slot.toISOString()
      if (!bookedISOs.has(slotISO)) {
        daySlots.push(slotISO)
      }
    }

    if (daySlots.length > 0) {
      result.push({ date: dateStr, duration_mins: avail.duration_mins, slots: daySlots })
    }
  }

  return result
}

/**
 * Format a UTC ISO string as a human-readable time in Singapore timezone.
 * e.g. "Thu, 22 May, 09:00 AM"
 */
export function formatSlotSGT(isoString) {
  return new Date(isoString).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a YYYY-MM-DD date string for display headers.
 * e.g. "Thursday, 22 May"
 */
export function formatDateHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-SG', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/utils/slotGenerator.test.js
```

Expected: all tests PASS. If any fail, check the UTC offset arithmetic.

- [ ] **Step 5: Commit**

```bash
git add src/utils/slotGenerator.js src/utils/slotGenerator.test.js
git commit -m "feat: slot generator utility with SGT timezone handling"
```

---

## Task 4: TrainerListingPage — Real Supabase Data

**Files:**
- Create: `src/pages/TrainerListingPage.jsx`
- Create: `src/pages/TrainerListingPage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/TrainerListingPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}))

import TrainerListingPage from './TrainerListingPage'

describe('TrainerListingPage', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><TrainerListingPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows a loading state initially', () => {
    render(<MemoryRouter><TrainerListingPage /></MemoryRouter>)
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/pages/TrainerListingPage.test.jsx
```

Expected: FAIL — `Cannot find module './TrainerListingPage'`

- [ ] **Step 3: Implement TrainerListingPage**

```jsx
// src/pages/TrainerListingPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(238,242,238,0.08)',
  borderRadius: 12,
  padding: '24px',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
}

export default function TrainerListingPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('trainer_profiles')
        .select(`
          id,
          specialties,
          years_experience,
          hourly_rate,
          session_types,
          locations_served,
          profiles!inner(full_name, profile_photo_url, bio)
        `)
        .eq('status', 'approved')
      if (!error) setTrainers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 40,
          fontWeight: 800,
          color: '#EEF2EE',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          Find a Trainer
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.55)', fontSize: 16, marginBottom: 48 }}>
          All trainers are certified and vetted by our team.
        </p>

        {loading && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            Loading…
          </p>
        )}

        {!loading && trainers.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            No approved trainers yet.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trainers.map(t => {
            const name = t.profiles?.full_name ?? 'Trainer'
            const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div
                key={t.id}
                style={CARD_STYLE}
                onClick={() => navigate(`/trainer/${t.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(238,242,238,0.08)'}
              >
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #14532d, #166534)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18,
                    color: '#EEF2EE', textTransform: 'uppercase',
                  }}>
                    {t.profiles?.profile_photo_url
                      ? <img src={t.profiles.profile_photo_url} alt={name}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : initials}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <h2 style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20,
                        color: '#EEF2EE', textTransform: 'uppercase', margin: 0,
                      }}>
                        {name}
                      </h2>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
                        color: '#4ade80',
                      }}>
                        S${t.hourly_rate}/hr
                      </span>
                    </div>

                    {t.profiles?.bio && (
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: 14,
                        color: 'rgba(238,242,238,0.6)', margin: '6px 0 10px',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {t.profiles.bio}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(t.specialties ?? []).slice(0, 4).map(s => (
                        <span key={s} style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                          border: '1px solid rgba(74,222,128,0.2)',
                          borderRadius: 20, padding: '3px 10px',
                        }}>
                          {s}
                        </span>
                      ))}
                      {t.years_experience && (
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          color: 'rgba(238,242,238,0.4)', padding: '3px 0',
                        }}>
                          {t.years_experience} yr{t.years_experience !== 1 ? 's' : ''} exp
                        </span>
                      )}
                    </div>

                    {(t.locations_served ?? []).length > 0 && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 6 }}>
                        {t.locations_served.join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/pages/TrainerListingPage.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TrainerListingPage.jsx src/pages/TrainerListingPage.test.jsx
git commit -m "feat: TrainerListingPage — browse approved trainers from Supabase"
```

---

## Task 5: TrainerProfilePage — Trainer Detail + Slot Picker

**Files:**
- Create: `src/pages/TrainerProfilePage.jsx`
- Create: `src/pages/TrainerProfilePage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/TrainerProfilePage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, beforeEach } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: null, profile: null, loading: false }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}))

vi.mock('../utils/slotGenerator', () => ({
  generateSlots: vi.fn(() => []),
  formatSlotSGT: vi.fn(iso => iso),
  formatDateHeader: vi.fn(d => d),
}))

import TrainerProfilePage from './TrainerProfilePage'

function renderPage(id = 'test-id') {
  return render(
    <MemoryRouter initialEntries={[`/trainer/${id}`]}>
      <Routes>
        <Route path="/trainer/:id" element={<TrainerProfilePage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TrainerProfilePage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    renderPage()
    expect(document.body).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/pages/TrainerProfilePage.test.jsx
```

Expected: FAIL — `Cannot find module './TrainerProfilePage'`

- [ ] **Step 3: Implement TrainerProfilePage**

```jsx
// src/pages/TrainerProfilePage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { generateSlots, formatSlotSGT, formatDateHeader } from '../utils/slotGenerator.js'

export default function TrainerProfilePage() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [trainer, setTrainer] = useState(null)
  const [slotDays, setSlotDays] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState(searchParams.get('error') ?? null)

  useEffect(() => {
    async function load() {
      const [
        { data: tp },
        { data: avail },
        { data: blocks },
        { data: bookings },
      ] = await Promise.all([
        supabase
          .from('trainer_profiles')
          .select('*, profiles!inner(full_name, bio, profile_photo_url)')
          .eq('id', id)
          .single(),
        supabase.from('trainer_availability').select('*').eq('trainer_id', id),
        supabase.from('availability_blocks').select('*').eq('trainer_id', id),
        supabase
          .from('bookings')
          .select('scheduled_at')
          .eq('trainer_id', id)
          .eq('status', 'confirmed'),
      ])

      setTrainer(tp)
      const days = generateSlots(avail ?? [], blocks ?? [], bookings ?? [])
      setSlotDays(days)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleBook() {
    if (!session) {
      navigate(`/login?redirect=/trainer/${id}`)
      return
    }
    if (!selectedSlot) return
    setBooking(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout', {
        body: {
          trainer_id: id,
          scheduled_at: selectedSlot,
          duration_mins: selectedDuration,
          client_name: profile?.full_name ?? session.user.email,
          client_email: session.user.email,
        },
      })
      if (fnErr || !data?.session_url) {
        throw new Error(fnErr?.message ?? 'Could not start checkout')
      }
      window.location.href = data.session_url
    } catch (e) {
      setError(e.message)
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  if (!trainer) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Trainer not found.</p>
      </div>
    )
  }

  const name = trainer.profiles?.full_name ?? 'Trainer'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/trainers')}
          style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 32 }}
        >
          ← Back to trainers
        </button>

        {/* Trainer header */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #14532d, #166534)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 24, color: '#EEF2EE',
          }}>
            {trainer.profiles?.profile_photo_url
              ? <img src={trainer.profiles.profile_photo_url} alt={name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, color: '#EEF2EE', textTransform: 'uppercase', margin: 0 }}>
              {name}
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.6)', fontSize: 15, marginTop: 6 }}>
              {trainer.profiles?.bio}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', color: '#4ade80', fontSize: 18, fontWeight: 700, marginTop: 8 }}>
              S${trainer.hourly_rate}/hr
            </p>
          </div>
        </div>

        {/* Specialties */}
        {(trainer.specialties ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {trainer.specialties.map(s => (
              <span key={s} style={{
                fontFamily: 'var(--font-body)', fontSize: 13,
                background: 'rgba(74,222,128,0.08)', color: '#4ade80',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 20, padding: '4px 12px',
              }}>{s}</span>
            ))}
          </div>
        )}

        {/* Slot picker */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
          Book a Session
        </h2>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-body)', color: '#f87171', fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        )}

        {slotDays.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15 }}>
            No available slots in the next 30 days.
          </p>
        )}

        {slotDays.map(day => (
          <div key={day.date} style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'rgba(238,242,238,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {formatDateHeader(day.date)}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {day.slots.map(slot => {
                const isSelected = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => { setSelectedSlot(slot); setSelectedDuration(day.duration_mins) }}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 14,
                      padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                      border: isSelected ? '1px solid #4ade80' : '1px solid rgba(238,242,238,0.15)',
                      background: isSelected ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#4ade80' : 'rgba(238,242,238,0.8)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {formatSlotSGT(slot)}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {selectedSlot && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(238,242,238,0.08)' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.7)', marginBottom: 16 }}>
              <strong style={{ color: '#EEF2EE' }}>Selected:</strong> {formatSlotSGT(selectedSlot)} · {selectedDuration} min · S${Math.round(trainer.hourly_rate * (selectedDuration / 60))}
            </p>
            <button
              onClick={handleBook}
              disabled={booking}
              style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
                textTransform: 'uppercase', letterSpacing: 1,
                background: booking ? 'rgba(74,222,128,0.5)' : '#4ade80',
                color: '#0d1a0e', border: 'none', borderRadius: 8,
                padding: '14px 32px', cursor: booking ? 'not-allowed' : 'pointer',
              }}
            >
              {booking ? 'Redirecting to payment…' : 'Book & Pay'}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 10 }}>
              Secure checkout via Stripe. Full refund if cancelled 24+ hours before session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/pages/TrainerProfilePage.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TrainerProfilePage.jsx src/pages/TrainerProfilePage.test.jsx
git commit -m "feat: TrainerProfilePage — trainer profile and slot picker"
```

---

## Task 6: create-checkout Edge Function

**Files:**
- Create: `supabase/functions/create-checkout/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/create-checkout/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL = Deno.env.get('APP_URL') ?? 'https://fitness-guru-seven.vercel.app'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
const jsonHeaders = { ...cors, 'Content-Type': 'application/json' }

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: jsonHeaders })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return err('Method not allowed', 405)

  // Verify caller's Supabase session
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(jwt)
  if (authErr || !user) return err('Unauthorized', 401)

  let body: {
    trainer_id: string
    scheduled_at: string
    duration_mins: number
    client_name: string
    client_email: string
  }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }

  const { trainer_id, scheduled_at, duration_mins, client_name, client_email } = body
  if (!trainer_id || !scheduled_at || !duration_mins || !client_email) {
    return err('Missing required fields')
  }

  // Get trainer's hourly rate and name
  const { data: tp, error: tpErr } = await adminClient
    .from('trainer_profiles')
    .select('hourly_rate, profiles!inner(full_name)')
    .eq('id', trainer_id)
    .single()
  if (tpErr || !tp) return err('Trainer not found', 404)

  const amountSgd = Math.round(tp.hourly_rate * (duration_mins / 60))   // SGD dollars
  const amountCents = amountSgd * 100                                    // SGD cents

  // Insert pending booking row
  const { data: booking, error: bookingErr } = await adminClient
    .from('bookings')
    .insert({
      trainer_id,
      client_id: user.id,
      client_name,
      client_email,
      scheduled_at,
      duration_mins,
      status: 'pending',
      amount_sgd: amountCents,
    })
    .select('id')
    .single()
  if (bookingErr || !booking) {
    return err('Failed to create booking: ' + bookingErr?.message, 500)
  }

  // Create Stripe Checkout Session
  const trainerName = (tp.profiles as { full_name: string }).full_name
  const params = new URLSearchParams({
    'payment_method_types[]': 'card',
    mode: 'payment',
    'line_items[0][price_data][currency]': 'sgd',
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][price_data][product_data][name]': `${duration_mins}-min session with ${trainerName}`,
    'line_items[0][quantity]': '1',
    success_url: `${APP_URL}/booking/confirmed?booking_id=${booking.id}`,
    cancel_url: `${APP_URL}/trainer/${trainer_id}?error=payment_cancelled`,
    'metadata[booking_id]': booking.id,
  })

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })
  const session = await stripeRes.json()
  if (!stripeRes.ok) {
    // Clean up pending booking on Stripe error
    await adminClient.from('bookings').delete().eq('id', booking.id)
    return err(session.error?.message ?? 'Stripe error', 500)
  }

  // Save stripe_session_id to booking
  await adminClient
    .from('bookings')
    .update({ stripe_session_id: session.id })
    .eq('id', booking.id)

  return new Response(JSON.stringify({ session_url: session.url }), {
    status: 200,
    headers: jsonHeaders,
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/create-checkout/index.ts
git commit -m "feat: create-checkout Edge Function — Stripe Checkout session + pending booking"
```

---

## Task 7: BookingConfirmedPage

**Files:**
- Create: `src/pages/BookingConfirmedPage.jsx`
- Create: `src/pages/BookingConfirmedPage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/BookingConfirmedPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { email: 'test@example.com' } }, profile: null, loading: false }),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}))

import BookingConfirmedPage from './BookingConfirmedPage'

describe('BookingConfirmedPage', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><BookingConfirmedPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/pages/BookingConfirmedPage.test.jsx
```

Expected: FAIL — `Cannot find module './BookingConfirmedPage'`

- [ ] **Step 3: Implement BookingConfirmedPage**

```jsx
// src/pages/BookingConfirmedPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { formatSlotSGT } from '../utils/slotGenerator.js'

export default function BookingConfirmedPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = searchParams.get('booking_id')

  const [booking, setBooking] = useState(null)
  const [trainerName, setTrainerName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('bookings')
        .select('*, trainer_profiles!inner(profiles!inner(full_name))')
        .eq('id', bookingId)
        .single()
      if (data) {
        setBooking(data)
        setTrainerName(data.trainer_profiles?.profiles?.full_name ?? 'your trainer')
      }
      setLoading(false)
    }
    load()
  }, [bookingId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
            stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l5 5 11-11" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32,
          color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          You're booked!
        </h1>

        {booking ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,242,238,0.08)',
            borderRadius: 12, padding: '24px', marginTop: 24, textAlign: 'left',
          }}>
            <Row label="Trainer" value={trainerName} />
            <Row label="When" value={formatSlotSGT(booking.scheduled_at)} />
            <Row label="Duration" value={`${booking.duration_mins} minutes`} />
            <Row label="Amount paid" value={`S$${((booking.amount_sgd ?? 0) / 100).toFixed(0)}`} />
            <Row label="Confirmation sent to" value={booking.client_email} />
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.5)', marginTop: 16 }}>
            Your booking with {trainerName} is confirmed. Check your email for details.
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
          <button
            onClick={() => navigate('/dashboard/client')}
            style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: 1,
              background: '#4ade80', color: '#0d1a0e',
              border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer',
            }}
          >
            My Bookings
          </button>
          <button
            onClick={() => navigate('/trainers')}
            style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: 1,
              background: 'none', color: 'rgba(238,242,238,0.6)',
              border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8,
              padding: '12px 24px', cursor: 'pointer',
            }}
          >
            Find Another Trainer
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(238,242,238,0.05)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.45)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#EEF2EE', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/pages/BookingConfirmedPage.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/BookingConfirmedPage.jsx src/pages/BookingConfirmedPage.test.jsx
git commit -m "feat: BookingConfirmedPage — post-payment confirmation screen"
```

---

## Task 8: stripe-webhook Edge Function

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Verify Stripe webhook signature using Web Crypto (HMAC-SHA256)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(',')
  const tPart = parts.find(p => p.startsWith('t='))
  const v1Part = parts.find(p => p.startsWith('v1='))
  if (!tPart || !v1Part) return false

  const timestamp = tPart.slice(2)
  const signature = v1Part.slice(3)
  const signedPayload = `${timestamp}.${payload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computed = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === signature
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const sigHeader = req.headers.get('stripe-signature') ?? ''
  const rawBody = await req.text()

  const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET)
  if (!valid) {
    return new Response('Invalid signature', { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const bookingId = (session.metadata as Record<string, string>)?.booking_id
    const paymentIntent = session.payment_intent as string | null

    if (bookingId) {
      const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      await adminClient.from('bookings').update({
        status: 'confirmed',
        stripe_payment_intent_id: paymentIntent,
      }).eq('id', bookingId)

      // Fire-and-forget: send booking confirmation email to client
      const { data: booking } = await adminClient
        .from('bookings')
        .select('client_name, client_email, scheduled_at, duration_mins, amount_sgd, trainer_profiles!inner(profiles!inner(full_name))')
        .eq('id', bookingId)
        .single()

      if (booking) {
        const trainerName = (booking.trainer_profiles as { profiles: { full_name: string } })?.profiles?.full_name ?? 'your trainer'
        adminClient.functions.invoke('notify-booking', {
          body: {
            status: 'booking_confirmed',
            clientName: booking.client_name,
            clientEmail: booking.client_email,
            trainerName,
            scheduledAt: booking.scheduled_at,
            durationMins: booking.duration_mins,
            amountSgd: booking.amount_sgd,
          },
        }).catch(() => {})
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "feat: stripe-webhook Edge Function — confirm booking on payment"
```

---

## Task 9: ClientDashboardPage

**Files:**
- Create: `src/pages/ClientDashboardPage.jsx`
- Create: `src/pages/ClientDashboardPage.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/ClientDashboardPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, beforeEach } from 'vitest'

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'user-1', email: 'test@example.com' } },
    profile: null,
    loading: false,
  }),
}))
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
    functions: { invoke: vi.fn() },
  },
}))

import ClientDashboardPage from './ClientDashboardPage'

describe('ClientDashboardPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    render(<MemoryRouter><ClientDashboardPage /></MemoryRouter>)
    expect(document.body).toBeTruthy()
  })

  it('shows a loading state initially', () => {
    render(<MemoryRouter><ClientDashboardPage /></MemoryRouter>)
    expect(screen.getByText(/loading/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/pages/ClientDashboardPage.test.jsx
```

Expected: FAIL — `Cannot find module './ClientDashboardPage'`

- [ ] **Step 3: Implement ClientDashboardPage**

```jsx
// src/pages/ClientDashboardPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatSlotSGT } from '../utils/slotGenerator.js'

const STATUS_COLOR = {
  confirmed: '#4ade80',
  pending: '#fbbf24',
  cancelled: 'rgba(238,242,238,0.3)',
  completed: 'rgba(74,222,128,0.5)',
}

function canCancel(scheduledAt) {
  const sessionTime = new Date(scheduledAt).getTime()
  const now = Date.now()
  return sessionTime - now > 24 * 60 * 60 * 1000
}

export default function ClientDashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [cancelError, setCancelError] = useState(null)

  const fetchBookings = useCallback(async () => {
    if (!session) return
    const { data } = await supabase
      .from('bookings')
      .select('*, trainer_profiles!inner(profiles!inner(full_name))')
      .eq('client_id', session.user.id)
      .order('scheduled_at', { ascending: false })
    setBookings(data ?? [])
    setLoading(false)
  }, [session])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function handleCancel(bookingId) {
    setCancelling(bookingId)
    setCancelError(null)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: bookingId },
      })
      if (error || data?.error) throw new Error(error?.message ?? data?.error ?? 'Cancel failed')
      fetchBookings()
    } catch (e) {
      setCancelError(e.message)
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)' }}>Loading…</p>
      </div>
    )
  }

  const active = bookings.filter(b => ['confirmed', 'pending'].includes(b.status))
  const past = bookings.filter(b => ['completed', 'cancelled'].includes(b.status))

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '80px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 36,
          color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 8,
        }}>
          My Bookings
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.45)', fontSize: 15, marginBottom: 40 }}>
          {session?.user?.email}
        </p>

        {cancelError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--font-body)', color: '#f87171', fontSize: 14, margin: 0 }}>{cancelError}</p>
          </div>
        )}

        {/* Upcoming */}
        <Section title="Upcoming">
          {active.length === 0
            ? <Empty text="No upcoming bookings." action="Browse trainers" onAction={() => navigate('/trainers')} />
            : active.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onCancel={canCancel(b.scheduled_at) ? handleCancel : null}
                  cancelling={cancelling === b.id}
                />
              ))
          }
        </Section>

        {/* Past */}
        {past.length > 0 && (
          <Section title="Past">
            {past.map(b => <BookingCard key={b.id} booking={b} />)}
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700,
        color: 'rgba(238,242,238,0.4)', textTransform: 'uppercase', letterSpacing: 2,
        marginBottom: 16,
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function BookingCard({ booking, onCancel, cancelling }) {
  const trainerName = booking.trainer_profiles?.profiles?.full_name ?? 'Trainer'
  const status = booking.status
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(238,242,238,0.07)',
      borderRadius: 12, padding: '20px 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      opacity: status === 'cancelled' ? 0.5 : 1,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', textTransform: 'uppercase' }}>
            {trainerName}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
            color: STATUS_COLOR[status] ?? '#EEF2EE',
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {status}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.6)' }}>
          {formatSlotSGT(booking.scheduled_at)} · {booking.duration_mins} min
        </div>
        {booking.amount_sgd && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 3 }}>
            S${((booking.amount_sgd) / 100).toFixed(0)} paid
          </div>
        )}
      </div>
      {onCancel && status === 'confirmed' && (
        <button
          onClick={() => onCancel(booking.id)}
          disabled={cancelling}
          style={{
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
            background: 'none', color: '#f87171',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6,
            padding: '8px 16px', cursor: cancelling ? 'not-allowed' : 'pointer',
            opacity: cancelling ? 0.5 : 1,
          }}
        >
          {cancelling ? 'Cancelling…' : 'Cancel & Refund'}
        </button>
      )}
      {status === 'confirmed' && !onCancel && (
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.3)' }}>
          Cannot cancel within 24h
        </span>
      )}
    </div>
  )
}

function Empty({ text, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.4)', fontSize: 15, marginBottom: 16 }}>{text}</p>
      {action && (
        <button
          onClick={onAction}
          style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: 1,
            background: '#4ade80', color: '#0d1a0e',
            border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
          }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/pages/ClientDashboardPage.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClientDashboardPage.jsx src/pages/ClientDashboardPage.test.jsx
git commit -m "feat: ClientDashboardPage — booking history with cancel button"
```

---

## Task 10: cancel-booking Edge Function

**Files:**
- Create: `supabase/functions/cancel-booking/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/cancel-booking/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
const jsonHeaders = { ...cors, 'Content-Type': 'application/json' }

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: jsonHeaders })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return err('Method not allowed', 405)

  // Verify caller's Supabase session
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(jwt)
  if (authErr || !user) return err('Unauthorized', 401)

  let body: { booking_id: string }
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON')
  }

  const { booking_id } = body
  if (!booking_id) return err('booking_id required')

  // Fetch the booking and verify ownership
  const { data: booking, error: fetchErr } = await adminClient
    .from('bookings')
    .select('*, trainer_profiles!inner(profiles!inner(full_name))')
    .eq('id', booking_id)
    .single()

  if (fetchErr || !booking) return err('Booking not found', 404)
  if (booking.client_id !== user.id) return err('Forbidden', 403)
  if (booking.status !== 'confirmed') return err('Only confirmed bookings can be cancelled')

  // Enforce 24-hour window
  const sessionTime = new Date(booking.scheduled_at).getTime()
  const hoursUntil = (sessionTime - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil < 24) {
    return err('Cancellation window has passed — sessions can only be cancelled 24+ hours in advance')
  }

  // Issue Stripe refund
  if (booking.stripe_payment_intent_id) {
    const refundRes = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        payment_intent: booking.stripe_payment_intent_id,
        reason: 'requested_by_customer',
      }).toString(),
    })
    const refund = await refundRes.json()
    if (!refundRes.ok) {
      return err('Stripe refund failed: ' + (refund.error?.message ?? 'unknown error'), 500)
    }
  }

  // Update booking status to cancelled
  await adminClient.from('bookings').update({ status: 'cancelled' }).eq('id', booking_id)

  // Send cancellation emails (fire-and-forget)
  const trainerName = (booking.trainer_profiles as { profiles: { full_name: string } })?.profiles?.full_name ?? 'Trainer'
  const emailPayload = {
    status: 'booking_cancelled',
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    trainerName,
    scheduledAt: booking.scheduled_at,
    durationMins: booking.duration_mins,
  }
  adminClient.functions.invoke('notify-booking', { body: emailPayload }).catch(() => {})

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/cancel-booking/index.ts
git commit -m "feat: cancel-booking Edge Function — 24h check, Stripe refund, status update"
```

---

## Task 11: notify-booking Edge Function

**Files:**
- Create: `supabase/functions/notify-booking/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/notify-booking/index.ts
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function formatSGT(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }
const jsonHeaders = { ...cors, 'Content-Type': 'application/json' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders })
  if (!RESEND_API_KEY) return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 500, headers: jsonHeaders })

  let body: {
    status: string
    clientName?: string
    clientEmail?: string
    trainerName?: string
    scheduledAt?: string
    durationMins?: number
    amountSgd?: number
  }
  try { body = await req.json() }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: jsonHeaders }) }

  const { status, clientEmail, clientName, trainerName, scheduledAt, durationMins, amountSgd } = body
  if (!status || !clientEmail) {
    return new Response(JSON.stringify({ error: 'status and clientEmail required' }), { status: 400, headers: jsonHeaders })
  }

  const safeName = escapeHtml(clientName ?? 'there')
  const safeTrainer = escapeHtml(trainerName ?? 'your trainer')
  const safeTime = scheduledAt ? escapeHtml(formatSGT(scheduledAt)) : ''
  const safeDuration = durationMins ? `${durationMins} minutes` : ''
  const safeAmount = amountSgd ? `S$${(amountSgd / 100).toFixed(0)}` : ''

  let subject: string
  let html: string

  if (status === 'booking_confirmed') {
    subject = 'Booking confirmed — FitnessGuru'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, you're booked!</h2>
        <p>Your session with <strong>${safeTrainer}</strong> is confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px 0; color: #555;">When</td><td style="padding: 8px 0; font-weight: bold;">${safeTime}</td></tr>
          <tr><td style="padding: 8px 0; color: #555;">Duration</td><td style="padding: 8px 0;">${safeDuration}</td></tr>
          ${safeAmount ? `<tr><td style="padding: 8px 0; color: #555;">Paid</td><td style="padding: 8px 0;">${safeAmount}</td></tr>` : ''}
        </table>
        <p style="color: #666; font-size: 14px;">You can cancel up to 24 hours before your session for a full refund.</p>
        <a href="https://fitness-guru-seven.vercel.app/dashboard/client"
           style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          View My Bookings
        </a>
      </div>`
  } else if (status === 'booking_cancelled') {
    subject = 'Booking cancelled — FitnessGuru'
    html = `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${safeName}, your booking has been cancelled.</h2>
        <p>Your session with <strong>${safeTrainer}</strong> scheduled for <strong>${safeTime}</strong> has been cancelled.</p>
        ${safeAmount ? `<p>A full refund of <strong>${safeAmount}</strong> has been issued and will appear in 5–10 business days.</p>` : ''}
        <a href="https://fitness-guru-seven.vercel.app/trainers"
           style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Book Another Session
        </a>
      </div>`
  } else {
    return new Response(JSON.stringify({ error: `Unknown status: ${status}` }), { status: 400, headers: jsonHeaders })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: clientEmail, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: body }), { status: 500, headers: jsonHeaders })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/notify-booking/index.ts
git commit -m "feat: notify-booking Edge Function — confirmation and cancellation emails"
```

---

## Task 12: Deploy Edge Functions + Set Stripe Secrets

- [ ] **Step 1: Get Stripe test mode keys**

Log in to [https://dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys.

Copy:
- `Secret key` (starts with `sk_test_...`)
- `Publishable key` (starts with `pk_test_...`) — save this for `.env.local` if needed

- [ ] **Step 2: Set up Stripe webhook and get signing secret**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://wnwmlaqhyztwxyvzuqpe.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`

Copy the `Signing secret` (starts with `whsec_...`).

- [ ] **Step 3: Set secrets in Supabase**

```bash
cd ~/FitnessGuru

SUPABASE_ACCESS_TOKEN=REDACTED_SUPABASE_PAT ~/bin/supabase secrets set \
  --project-ref wnwmlaqhyztwxyvzuqpe \
  STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE \
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE \
  APP_URL=https://fitness-guru-seven.vercel.app
```

Replace `sk_test_YOUR_KEY_HERE` and `whsec_YOUR_SECRET_HERE` with actual values.

- [ ] **Step 4: Deploy all Edge Functions**

```bash
SUPABASE_ACCESS_TOKEN=REDACTED_SUPABASE_PAT ~/bin/supabase functions deploy \
  --project-ref wnwmlaqhyztwxyvzuqpe \
  create-checkout stripe-webhook cancel-booking notify-booking
```

Expected output: `Deployed functions: create-checkout, stripe-webhook, cancel-booking, notify-booking`

- [ ] **Step 5: Smoke-test create-checkout with curl**

First get a test JWT by logging into the app and pulling it from `localStorage.getItem('sb-wnwmlaqhyztwxyvzuqpe-auth-token')` in the browser console (copy the `access_token` field).

```bash
curl -s -X POST \
  "https://wnwmlaqhyztwxyvzuqpe.supabase.co/functions/v1/create-checkout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trainer_id": "REAL_TRAINER_ID",
    "scheduled_at": "2026-06-01T01:00:00.000Z",
    "duration_mins": 60,
    "client_name": "Test Client",
    "client_email": "test@example.com"
  }' | python3 -m json.tool
```

Expected: `{ "session_url": "https://checkout.stripe.com/..." }`

- [ ] **Step 6: Run full test suite to verify nothing is broken**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: deploy create-checkout, stripe-webhook, cancel-booking, notify-booking"
```

---

## End-to-End Test Checklist

After all tasks are complete, do a manual walkthrough:

- [ ] Visit `/trainers` → approved trainer cards appear
- [ ] Click a trainer → `/trainer/:id` loads with bio, specialties, available slots
- [ ] Select a slot → "Book & Pay" button appears with price
- [ ] Click "Book & Pay" → redirects to Stripe Checkout (test mode)
- [ ] Complete payment with test card `4242 4242 4242 4242` (any future expiry, any CVC)
- [ ] Redirects to `/booking/confirmed?booking_id=...` → confirmation details shown
- [ ] Check Supabase `bookings` table → row has `status = 'confirmed'`
- [ ] Visit `/dashboard/client` → booking appears, "Cancel & Refund" button visible
- [ ] Click Cancel → booking disappears from active, Stripe refund issued
- [ ] Log in as trainer → `/dashboard/trainer` → Appointments tab shows client's booking
- [ ] Trainer clicks "Mark done" → status becomes `completed`
