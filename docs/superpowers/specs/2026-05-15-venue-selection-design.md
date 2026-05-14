# Training Venue Selection — Design Spec

**Goal:** Clients specify where they want to train at booking time. The agreed venue is stored on the booking and surfaced to both trainer and client across dashboards, confirmation page, and email notifications.

**Architecture:** Two new nullable columns on `bookings` (`venue_type`, `venue_name`) populated at checkout creation time in the `create-checkout` Edge Function. A new `VenuePicker` React component handles the type + conditional secondary input UI. Venue is displayed read-only wherever bookings are shown.

**Tech Stack:** React 19 (inline styles only), Supabase Postgres migration, Deno Edge Functions (TypeScript), Resend email.

---

## Venue Types

| `venue_type` value | Label shown to user | Secondary input |
|---|---|---|
| `condo_gym` | Condo Gym | Free-text: building name (e.g. "The Interlace, Depot Road") |
| `activesg` | ActiveSG Gym | Region dropdown → gym name dropdown filtered by region |
| `commercial_gym` | Commercial Gym | Free-text: gym name (e.g. "Fitness First Raffles City") |
| `outdoor` | Outdoor | Free-text: location (e.g. "East Coast Park near Carpark E2") |
| `home` | Home | Free-text: area/district only (e.g. "Tampines") |
| `other` | Other | Free-text: describe the location |

---

## ActiveSG Gym List (hardcoded by region)

```js
// src/data/activesg-gyms.js
export const ACTIVESG_REGIONS = ['Central', 'East', 'North', 'Northeast', 'West']

export const ACTIVESG_GYMS = {
  Central: [
    'ActiveSG Gym @ Bishan Sports Centre',
    'ActiveSG Gym @ Delta Sports Centre',
    'ActiveSG Gym @ Jalan Besar Sports Centre',
    'ActiveSG Gym @ Queenstown Sports Centre',
    'ActiveSG Gym @ Toa Payoh Sports Centre',
    'ActiveSG Gym @ Kallang Leisure Park',
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

---

## Data Model

### Migration: `supabase/migrations/008_venue.sql`

Add two nullable columns to the existing `bookings` table. Nullable so existing bookings without venue data are unaffected.

```sql
alter table public.bookings
  add column if not exists venue_type text
    check (venue_type in ('condo_gym', 'activesg', 'commercial_gym', 'outdoor', 'home', 'other')),
  add column if not exists venue_name text;
```

No RLS changes needed — venue columns inherit existing booking RLS (trainer sees own bookings, client sees own).

---

## Components

### `src/components/VenuePicker.jsx`

Self-contained component. Props:

```js
VenuePicker({ value, onChange })
// value: { type: string | null, name: string }
// onChange: (newValue: { type, name }) => void
```

Renders:
1. **Type pills** — one pill per venue type. Selected pill uses `PILL_ACTIVE` style (matching existing dashboard pill styles). Tapping a pill sets `type` and clears `name`.
2. **Secondary input**, shown only when a type is selected:
   - `activesg`: region `<select>` + gym name `<select>` (filtered to selected region from `ACTIVESG_GYMS`). `onChange` called with gym name as `name` when gym is selected.
   - All other types: `<input type="text">` with a placeholder specific to the type. `onChange` called on every keystroke.

A `VenuePicker` with no type selected renders only the type pills. The component does not show an error state — validation is the caller's responsibility.

---

## Booking Flow (`TrainerProfilePage.jsx`)

After the slot picker and before the "Book & Pay" button, render:

```jsx
<h2>Where would you like to train?</h2>
<VenuePicker value={venue} onChange={setVenue} />
```

State: `const [venue, setVenue] = useState({ type: null, name: '' })`

**Validation before checkout:** `venue.type` must be set AND `venue.name` must be non-empty (trimmed). If invalid, show inline error: "Please select a venue type and enter a location." The "Book & Pay" button stays enabled but triggers validation on click (same pattern as existing error state).

**Pass to `create-checkout`:**

```js
body: {
  trainer_id: id,
  scheduled_at: selectedSlot,
  duration_mins: selectedDuration,
  client_name: profile?.full_name ?? session.user.email,
  client_email: session.user.email,
  venue_type: venue.type,
  venue_name: venue.name.trim(),
}
```

---

## Edge Function: `create-checkout`

Add `venue_type` and `venue_name` to the body type declaration and the `bookings` insert:

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

```ts
// In the bookings insert:
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

---

## Venue Display

### `BookingConfirmedPage.jsx`

Add a `<Row label="Where" value={booking.venue_name} />` line after the "When" row, rendered only when `booking.venue_name` is truthy:

```jsx
{booking.venue_name && <Row label="Where" value={booking.venue_name} />}
```

### `ClientDashboardPage.jsx`

Each booking card shows date/time + trainer name. Add venue below:

```jsx
{booking.venue_name && (
  <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: '2px 0 0' }}>
    {booking.venue_name}
  </p>
)}
```

### `TrainerDashboardPage.jsx`

Each appointment card in the Appointments tab shows date/time + client name. Add venue below:

```jsx
{appt.venue_name && (
  <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: '2px 0 0' }}>
    {appt.venue_name}
  </p>
)}
```

### `notify-booking` Edge Function

In the `booking_confirmed` HTML email, add a "Where" row to the existing `<table>`:

```ts
// Add venueName to the body type and destructuring:
venueName?: string

// In the table:
${body.venueName ? `<tr><td style="padding: 8px 0; color: #555;">Where</td><td style="padding: 8px 0; font-weight: bold;">${escapeHtml(body.venueName)}</td></tr>` : ''}
```

The stripe-webhook (which calls `notify-booking`) must pass `venue_name` from the booking record.

---

## Files Touched

| File | Change |
|---|---|
| `supabase/migrations/008_venue.sql` | Add `venue_type` + `venue_name` columns to `bookings` |
| `src/data/activesg-gyms.js` | Create: hardcoded ActiveSG gym list keyed by region |
| `src/components/VenuePicker.jsx` | Create: type pills + conditional secondary input |
| `src/components/VenuePicker.test.jsx` | Create: tests for type selection and secondary inputs |
| `src/pages/TrainerProfilePage.jsx` | Render `VenuePicker`, validate before checkout, pass venue to `create-checkout` |
| `src/pages/BookingConfirmedPage.jsx` | Show "Where" row when `venue_name` present |
| `src/pages/ClientDashboardPage.jsx` | Show venue on each booking card |
| `src/pages/TrainerDashboardPage.jsx` | Show venue on each appointment card |
| `supabase/functions/create-checkout/index.ts` | Accept + insert `venue_type` and `venue_name` |
| `supabase/functions/notify-booking/index.ts` | Accept + render `venueName` in confirmation email |
| `supabase/functions/stripe-webhook/index.ts` | Pass `venue_name` from booking to `notify-booking` call |

---

## Out of Scope

- Trainer-side venue preferences or filtering on listings page (future)
- Curated outdoor park list (free-text is sufficient)
- Saved venues on client profile (premature until repeat booking patterns emerge)
- Virtual/online sessions
