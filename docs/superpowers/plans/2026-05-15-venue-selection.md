# Training Venue Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clients select where they want to train (venue type + specific location) at booking time; the agreed venue is stored on the booking and shown on dashboards, confirmation page, and email.

**Architecture:** Two nullable columns (`venue_type`, `venue_name`) added to `bookings` via migration. A new `VenuePicker` React component handles type pills and conditional secondary inputs (ActiveSG uses region→gym cascade; all others use free-text). Venue flows into `create-checkout` at booking creation, surfaces read-only everywhere bookings are displayed.

**Tech Stack:** React 19 (inline styles only), Vitest + Testing Library, Supabase Postgres migration, Deno Edge Functions (TypeScript), Resend email.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/008_venue.sql` | Create | Add `venue_type` + `venue_name` columns to `bookings` |
| `src/data/activesg-gyms.js` | Create | Hardcoded ActiveSG gym list keyed by region |
| `src/components/VenuePicker.jsx` | Create | Type pills + conditional secondary input UI |
| `src/components/VenuePicker.test.jsx` | Create | Component tests |
| `src/pages/TrainerProfilePage.jsx` | Modify | Add VenuePicker, validate, pass to create-checkout |
| `src/pages/BookingConfirmedPage.jsx` | Modify | Show "Where" row when venue_name present |
| `src/pages/ClientDashboardPage.jsx` | Modify | Show venue on each booking card |
| `src/pages/TrainerDashboardPage.jsx` | Modify | Show venue on each appointment card |
| `supabase/functions/create-checkout/index.ts` | Modify | Accept + insert venue_type and venue_name |
| `supabase/functions/stripe-webhook/index.ts` | Modify | Include venue_name when calling notify-booking |
| `supabase/functions/notify-booking/index.ts` | Modify | Accept + render venueName in confirmation email |

---

### Task 1: DB migration — add venue columns to bookings

**Files:**
- Create: `supabase/migrations/008_venue.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/008_venue.sql

alter table public.bookings
  add column if not exists venue_type text
    check (venue_type in ('condo_gym', 'activesg', 'commercial_gym', 'outdoor', 'home', 'other')),
  add column if not exists venue_name text;
```

Columns are nullable so existing bookings without venue data are unaffected. No RLS changes needed — venue columns inherit existing booking RLS policies.

- [ ] **Step 2: Apply migration locally to verify syntax**

```bash
npx supabase db push --local
```

Expected: migration applied without errors (or "local DB not running" — either is fine; syntax is what matters here). Production deployment is Task 8.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/008_venue.sql
git commit -m "feat: add venue_type and venue_name columns to bookings"
```

---

### Task 2: ActiveSG gym data file

**Files:**
- Create: `src/data/activesg-gyms.js`

- [ ] **Step 1: Create the data file**

```js
// src/data/activesg-gyms.js

export const ACTIVESG_REGIONS = ['Central', 'East', 'North', 'Northeast', 'West']

export const ACTIVESG_GYMS = {
  Central: [
    'ActiveSG Gym @ Bishan Sports Centre',
    'ActiveSG Gym @ Delta Sports Centre',
    'ActiveSG Gym @ Jalan Besar Sports Centre',
    'ActiveSG Gym @ Kallang Leisure Park',
    'ActiveSG Gym @ Queenstown Sports Centre',
    'ActiveSG Gym @ Toa Payoh Sports Centre',
  ],
  East: [
    'ActiveSG Gym @ Bedok Sports Centre',
    'ActiveSG Gym @ Kallang Sports Hub',
    'ActiveSG Gym @ Pasir Ris Sports Centre',
    'ActiveSG Gym @ Tampines Sports Centre',
  ],
  North: [
    'ActiveSG Gym @ Admiralty',
    'ActiveSG Gym @ Sembawang Sports Centre',
    'ActiveSG Gym @ Woodlands Civic Centre',
    'ActiveSG Gym @ Yishun Sports Centre',
  ],
  Northeast: [
    'ActiveSG Gym @ Ang Mo Kio Sports Centre',
    'ActiveSG Gym @ Hougang Sports Centre',
    'ActiveSG Gym @ Punggol Sports Centre',
    'ActiveSG Gym @ Sengkang Sports Centre',
  ],
  West: [
    'ActiveSG Gym @ Bukit Batok Sports Centre',
    'ActiveSG Gym @ Choa Chu Kang Sports Centre',
    'ActiveSG Gym @ Clementi Sports Centre',
    'ActiveSG Gym @ Jurong East Sports Centre',
    'ActiveSG Gym @ Jurong West Sports Centre',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/activesg-gyms.js
git commit -m "feat: add ActiveSG gym list by region"
```

---

### Task 3: VenuePicker component

**Files:**
- Create: `src/components/VenuePicker.jsx`
- Create: `src/components/VenuePicker.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/VenuePicker.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VenuePicker from './VenuePicker'

describe('VenuePicker', () => {
  it('renders all six venue type pills', () => {
    render(<VenuePicker value={{ type: null, name: '' }} onChange={() => {}} />)
    expect(screen.getByText('Condo Gym')).toBeInTheDocument()
    expect(screen.getByText('ActiveSG Gym')).toBeInTheDocument()
    expect(screen.getByText('Commercial Gym')).toBeInTheDocument()
    expect(screen.getByText('Outdoor')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('calls onChange with type and empty name when pill clicked', () => {
    const onChange = vi.fn()
    render(<VenuePicker value={{ type: null, name: '' }} onChange={onChange} />)
    fireEvent.click(screen.getByText('Condo Gym'))
    expect(onChange).toHaveBeenCalledWith({ type: 'condo_gym', name: '' })
  })

  it('shows text input for condo_gym type', () => {
    render(<VenuePicker value={{ type: 'condo_gym', name: '' }} onChange={() => {}} />)
    expect(screen.getByPlaceholderText(/Building name/i)).toBeInTheDocument()
  })

  it('shows region dropdown for activesg type', () => {
    render(<VenuePicker value={{ type: 'activesg', name: '' }} onChange={() => {}} />)
    expect(screen.getByLabelText('Select region')).toBeInTheDocument()
  })

  it('shows gym dropdown after region is selected for activesg', () => {
    render(<VenuePicker value={{ type: 'activesg', name: '' }} onChange={() => {}} />)
    fireEvent.change(screen.getByLabelText('Select region'), { target: { value: 'East' } })
    expect(screen.getByLabelText('Select gym')).toBeInTheDocument()
  })

  it('does not show secondary input when no type selected', () => {
    render(<VenuePicker value={{ type: null, name: '' }} onChange={() => {}} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('calls onChange when text input changes', () => {
    const onChange = vi.fn()
    render(<VenuePicker value={{ type: 'home', name: '' }} onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Tampines' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'home', name: 'Tampines' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/VenuePicker.test.jsx
```

Expected: FAIL with "Cannot find module './VenuePicker'"

- [ ] **Step 3: Create the VenuePicker component**

```jsx
// src/components/VenuePicker.jsx
import { useState } from 'react'
import { ACTIVESG_REGIONS, ACTIVESG_GYMS } from '../data/activesg-gyms'

const VENUE_TYPES = [
  { key: 'condo_gym',      label: 'Condo Gym',      placeholder: 'Building name (e.g. The Interlace, Depot Road)' },
  { key: 'activesg',       label: 'ActiveSG Gym',   placeholder: null },
  { key: 'commercial_gym', label: 'Commercial Gym', placeholder: 'Gym name (e.g. Fitness First Raffles City)' },
  { key: 'outdoor',        label: 'Outdoor',         placeholder: 'Location (e.g. East Coast Park near Carpark E2)' },
  { key: 'home',           label: 'Home',            placeholder: 'Area or district (e.g. Tampines)' },
  { key: 'other',          label: 'Other',           placeholder: 'Describe the location' },
]

const PILL_ACTIVE   = { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
const PILL_INACTIVE = { background: 'transparent', color: 'rgba(238,242,238,0.4)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }
const INPUT  = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const SELECT = { ...INPUT, cursor: 'pointer' }

export default function VenuePicker({ value, onChange }) {
  const [region, setRegion] = useState('')

  function selectType(key) {
    setRegion('')
    onChange({ type: key, name: '' })
  }

  function selectRegion(r) {
    setRegion(r)
    onChange({ type: value.type, name: '' })
  }

  const typeConfig = VENUE_TYPES.find(t => t.key === value.type)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {VENUE_TYPES.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectType(t.key)}
            style={value.type === t.key ? PILL_ACTIVE : PILL_INACTIVE}
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.type === 'activesg' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            style={SELECT}
            value={region}
            onChange={e => selectRegion(e.target.value)}
            aria-label="Select region"
          >
            <option value="">Select region...</option>
            {ACTIVESG_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {region && (
            <select
              style={SELECT}
              value={value.name}
              onChange={e => onChange({ type: 'activesg', name: e.target.value })}
              aria-label="Select gym"
            >
              <option value="">Select gym...</option>
              {ACTIVESG_GYMS[region].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {value.type && value.type !== 'activesg' && (
        <input
          style={INPUT}
          type="text"
          placeholder={typeConfig?.placeholder ?? 'Enter location'}
          value={value.name}
          onChange={e => onChange({ type: value.type, name: e.target.value })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/VenuePicker.test.jsx
```

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/VenuePicker.jsx src/components/VenuePicker.test.jsx
git commit -m "feat: add VenuePicker component with type pills and ActiveSG cascade"
```

---

### Task 4: Add VenuePicker to booking flow (TrainerProfilePage)

**Files:**
- Modify: `src/pages/TrainerProfilePage.jsx`

**Context:** `TrainerProfilePage` (223 lines) has `handleBook()` which calls `supabase.functions.invoke('create-checkout', { body: { ... } })`. The booking panel renders after slot selection (around line 196): `{selectedSlot && (<div>...selected slot summary...<button>Book & Pay</button></div>)}`. We need to add venue state, render `VenuePicker` inside that panel, and validate before checkout.

- [ ] **Step 1: Add the import and venue state**

At the top of `TrainerProfilePage.jsx`, add the import after the existing imports:

```js
import VenuePicker from '../components/VenuePicker'
```

Inside the component function, after `const [error, setError] = ...`, add:

```js
const [venue, setVenue] = useState({ type: null, name: '' })
```

- [ ] **Step 2: Update handleBook to validate venue and pass it to create-checkout**

Replace the existing `handleBook` function:

```js
async function handleBook() {
  if (!session) {
    navigate(`/login?redirect=/trainer/${id}`)
    return
  }
  if (!selectedSlot) return

  if (!venue.type || !venue.name.trim()) {
    setError('Please select a venue type and enter a location.')
    return
  }

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
        venue_type: venue.type,
        venue_name: venue.name.trim(),
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
```

- [ ] **Step 3: Render VenuePicker in the booking panel**

Find the `{selectedSlot && (` block. It currently renders: slot summary → Book & Pay button. Replace that block with:

```jsx
{selectedSlot && (
  <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(238,242,238,0.08)' }}>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.7)', marginBottom: 24 }}>
      <strong style={{ color: '#EEF2EE' }}>Selected:</strong> {formatSlotSGT(selectedSlot)} · {selectedDuration} min · S${Math.round(trainer.hourly_rate * (selectedDuration / 60))}
    </p>

    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
      Where would you like to train?
    </h3>
    <VenuePicker value={venue} onChange={setVenue} />

    <div style={{ marginTop: 24 }}>
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
  </div>
)}
```

- [ ] **Step 4: Run the full test suite to check nothing broke**

```bash
npx vitest run --reporter=verbose
```

Expected: existing tests pass (TrainerProfilePage has no tests to break; other suites should be green)

- [ ] **Step 5: Commit**

```bash
git add src/pages/TrainerProfilePage.jsx
git commit -m "feat: add VenuePicker to booking flow with validation"
```

---

### Task 5: Update create-checkout Edge Function to store venue

**Files:**
- Modify: `supabase/functions/create-checkout/index.ts`

**Context:** `create-checkout` (119 lines) inserts a pending booking row at line 62–75. The body type declaration is at lines 31–38. We need to add `venue_type` and `venue_name` to both.

- [ ] **Step 1: Update the body type declaration**

Find this block (lines 31–38):

```ts
let body: {
  trainer_id: string
  scheduled_at: string
  duration_mins: number
  client_name: string
  client_email: string
}
```

Replace with:

```ts
let body: {
  trainer_id: string
  scheduled_at: string
  duration_mins: number
  client_name: string
  client_email: string
  venue_type?: string
  venue_name?: string
}
```

- [ ] **Step 2: Add venue fields to the bookings insert**

Find the `.insert({` block (around line 64). Replace:

```ts
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
```

With:

```ts
.insert({
  trainer_id,
  client_id: user.id,
  client_name,
  client_email,
  scheduled_at,
  duration_mins,
  status: 'pending',
  amount_sgd: amountCents,
  venue_type: body.venue_type ?? null,
  venue_name: body.venue_name ?? null,
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-checkout/index.ts
git commit -m "feat: store venue_type and venue_name on booking at checkout creation"
```

---

### Task 6: Pass venue through stripe-webhook and add to confirmation email

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`
- Modify: `supabase/functions/notify-booking/index.ts`

**Context:** `stripe-webhook` (98 lines) — after confirming payment, it selects the booking at line 71–75 and calls `notify-booking` at line 79–89. We need to add `venue_name` to the select and the call. `notify-booking` (106 lines) — the `booking_confirmed` HTML email at lines 61–77 has a `<table>` with When/Duration/Paid rows; add a Where row.

- [ ] **Step 1: Update stripe-webhook to fetch and forward venue_name**

In `stripe-webhook/index.ts`, find the booking select query (around line 71). Replace:

```ts
const { data: booking } = await adminClient
  .from('bookings')
  .select('client_name, client_email, scheduled_at, duration_mins, amount_sgd, trainer_profiles!inner(profiles!inner(full_name))')
  .eq('id', bookingId)
  .single()
```

With:

```ts
const { data: booking } = await adminClient
  .from('bookings')
  .select('client_name, client_email, scheduled_at, duration_mins, amount_sgd, venue_name, trainer_profiles!inner(profiles!inner(full_name))')
  .eq('id', bookingId)
  .single()
```

Then find the `adminClient.functions.invoke('notify-booking', {` call. Replace:

```ts
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
```

With:

```ts
adminClient.functions.invoke('notify-booking', {
  body: {
    status: 'booking_confirmed',
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    trainerName,
    scheduledAt: booking.scheduled_at,
    durationMins: booking.duration_mins,
    amountSgd: booking.amount_sgd,
    venueName: booking.venue_name ?? undefined,
  },
}).catch(() => {})
```

- [ ] **Step 2: Update notify-booking to accept and render venueName**

In `notify-booking/index.ts`, find the body type declaration (lines 35–44):

```ts
let body: {
  status: string
  clientName?: string
  clientEmail?: string
  trainerName?: string
  scheduledAt?: string
  durationMins?: number
  amountSgd?: number
}
```

Replace with:

```ts
let body: {
  status: string
  clientName?: string
  clientEmail?: string
  trainerName?: string
  scheduledAt?: string
  durationMins?: number
  amountSgd?: number
  venueName?: string
}
```

Find the destructuring line (line 47):

```ts
const { status, clientEmail, clientName, trainerName, scheduledAt, durationMins, amountSgd } = body
```

Replace with:

```ts
const { status, clientEmail, clientName, trainerName, scheduledAt, durationMins, amountSgd, venueName } = body
```

Add a `safeVenue` variable after the existing `safe*` variables (around line 56):

```ts
const safeVenue = venueName ? escapeHtml(venueName) : ''
```

Find the `<table>` in the `booking_confirmed` HTML (around line 67–71):

```ts
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 8px 0; color: #555;">When</td><td style="padding: 8px 0; font-weight: bold;">${safeTime}</td></tr>
  <tr><td style="padding: 8px 0; color: #555;">Duration</td><td style="padding: 8px 0;">${safeDuration}</td></tr>
  ${safeAmount ? `<tr><td style="padding: 8px 0; color: #555;">Paid</td><td style="padding: 8px 0;">${safeAmount}</td></tr>` : ''}
</table>
```

Replace with:

```ts
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 8px 0; color: #555;">When</td><td style="padding: 8px 0; font-weight: bold;">${safeTime}</td></tr>
  <tr><td style="padding: 8px 0; color: #555;">Duration</td><td style="padding: 8px 0;">${safeDuration}</td></tr>
  ${safeVenue ? `<tr><td style="padding: 8px 0; color: #555;">Where</td><td style="padding: 8px 0;">${safeVenue}</td></tr>` : ''}
  ${safeAmount ? `<tr><td style="padding: 8px 0; color: #555;">Paid</td><td style="padding: 8px 0;">${safeAmount}</td></tr>` : ''}
</table>
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts supabase/functions/notify-booking/index.ts
git commit -m "feat: include venue in booking confirmation email"
```

---

### Task 7: Display venue on confirmation page and dashboards

**Files:**
- Modify: `src/pages/BookingConfirmedPage.jsx`
- Modify: `src/pages/ClientDashboardPage.jsx`
- Modify: `src/pages/TrainerDashboardPage.jsx`

**Context:**
- `BookingConfirmedPage` (117 lines): fetches booking with `select('*, trainer_profiles!inner(...)')`. `*` includes `venue_name`. Renders `<Row>` components at lines 68–72. Add a "Where" row.
- `ClientDashboardPage` `BookingCard` (lines 161–211): fetches bookings with `select('*, trainer_profiles!inner(...)')`. `*` includes `venue_name`. Shows trainer name, status, date/time, amount. Add venue after amount line.
- `TrainerDashboardPage` `AppointmentsTab.BookingCard` (lines 106–121): fetches with `select('*')`. `*` includes `venue_name`. Shows client name, time, email, notes. Add venue after email line.

- [ ] **Step 1: Add venue row to BookingConfirmedPage**

Find this block (around line 69):

```jsx
<Row label="When" value={formatSlotSGT(booking.scheduled_at)} />
<Row label="Duration" value={`${booking.duration_mins} minutes`} />
<Row label="Amount paid" value={`S$${((booking.amount_sgd ?? 0) / 100).toFixed(0)}`} />
```

Replace with:

```jsx
<Row label="When" value={formatSlotSGT(booking.scheduled_at)} />
<Row label="Duration" value={`${booking.duration_mins} minutes`} />
{booking.venue_name && <Row label="Where" value={booking.venue_name} />}
<Row label="Amount paid" value={`S$${((booking.amount_sgd ?? 0) / 100).toFixed(0)}`} />
```

- [ ] **Step 2: Add venue to ClientDashboardPage BookingCard**

Find this block inside `BookingCard` (around lines 184–191):

```jsx
<div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.6)' }}>
  {formatSlotSGT(booking.scheduled_at)} · {booking.duration_mins} min
</div>
{booking.amount_sgd && (
  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 3 }}>
    S${((booking.amount_sgd) / 100).toFixed(0)} paid
  </div>
)}
```

Replace with:

```jsx
<div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.6)' }}>
  {formatSlotSGT(booking.scheduled_at)} · {booking.duration_mins} min
</div>
{booking.venue_name && (
  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)', marginTop: 3 }}>
    {booking.venue_name}
  </div>
)}
{booking.amount_sgd && (
  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>
    S${((booking.amount_sgd) / 100).toFixed(0)} paid
  </div>
)}
```

- [ ] **Step 3: Add venue to TrainerDashboardPage AppointmentsTab BookingCard**

Find this block inside `BookingCard` in `TrainerDashboardPage` (around lines 110–113):

```jsx
<div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)', marginTop: 3 }}>{formatDateTime(b.scheduled_at)} · {b.duration_mins} min</div>
{b.client_email && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>{b.client_email}</div>}
{b.notes && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</div>}
```

Replace with:

```jsx
<div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)', marginTop: 3 }}>{formatDateTime(b.scheduled_at)} · {b.duration_mins} min</div>
{b.venue_name && <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#4ade80', marginTop: 3 }}>{b.venue_name}</div>}
{b.client_email && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>{b.client_email}</div>}
{b.notes && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', marginTop: 4, fontStyle: 'italic' }}>"{b.notes}"</div>}
```

- [ ] **Step 4: Run full test suite**

```bash
npx vitest run --reporter=verbose
```

Expected: all previously passing tests still pass

- [ ] **Step 5: Commit**

```bash
git add src/pages/BookingConfirmedPage.jsx src/pages/ClientDashboardPage.jsx src/pages/TrainerDashboardPage.jsx
git commit -m "feat: display venue on confirmation page and dashboards"
```

---

### Task 8: Deploy — migration + Edge Functions

**Files:** none (deployment only)

- [ ] **Step 1: Push migration to production**

```bash
SUPABASE_ACCESS_TOKEN=<REDACTED> npx supabase link --project-ref wnwmlaqhyztwxyvzuqpe
SUPABASE_ACCESS_TOKEN=<REDACTED> npx supabase db push
```

Expected: prompt shows `008_venue.sql` → confirm with Y. Output: "Finished supabase db push."

- [ ] **Step 2: Deploy the three modified Edge Functions**

```bash
SUPABASE_ACCESS_TOKEN=<REDACTED> npx supabase functions deploy create-checkout --project-ref wnwmlaqhyztwxyvzuqpe
SUPABASE_ACCESS_TOKEN=<REDACTED> npx supabase functions deploy stripe-webhook --project-ref wnwmlaqhyztwxyvzuqpe
SUPABASE_ACCESS_TOKEN=<REDACTED> npx supabase functions deploy notify-booking --project-ref wnwmlaqhyztwxyvzuqpe
```

Expected: each deployment shows "Deployed Function <name>" with no errors.

- [ ] **Step 3: Push to GitHub and verify Vercel auto-deploys**

```bash
git push origin main
```

Expected: Vercel picks up the push and deploys automatically (check readyptsg.com within ~2 minutes).

- [ ] **Step 4: Smoke test on production**

1. Go to `readyptsg.com/trainers`, open any approved trainer profile
2. Select a time slot — the "Where would you like to train?" section should appear below the slot summary
3. Select "ActiveSG Gym" → pick a region → pick a gym → click "Book & Pay"
4. Verify Stripe checkout opens
5. After a test payment (use Stripe test card `4242 4242 4242 4242`), check `readyptsg.com/booking/confirmed?booking_id=...` — "Where" row should appear
6. Check client dashboard — venue should show on the booking card
7. Check trainer dashboard — venue should show on the appointment card (green)
