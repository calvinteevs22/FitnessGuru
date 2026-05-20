# Calendar Booking UI — Design Spec
**Date:** 2026-05-20
**Status:** Approved

## Problem
The trainer profile page shows all available slots as a flat vertical list grouped by date. With a trainer available every weekday, this produces 140+ buttons across 30 days — overwhelming and hard to navigate.

## Goal
Replace the flat list with a month calendar that lets users pick a date first, then see only that day's time slots. Inline venue picker and Stripe checkout flow remain unchanged.

## Layout

### Desktop (≥ 640px) — Two-column split
```
┌──────────────────────────────────────────────┐
│  BOOK A SESSION                              │
│  ┌───────────────────┐  ┌─────────────────┐  │
│  │   < MAY 2026 >    │  │  MON, 26 MAY   │  │
│  │  S  M  T  W  T  F  S  │  │                 │  │
│  │     ·  ·  ·  ●  ●  ·  │  │  06:00 am       │  │
│  │  ·  ●  ●  ●  ●  ●  ·  │  │  07:00 am       │  │
│  │  ...                  │  │  ● 08:00 am     │  │
│  └───────────────────┘  │  09:00 am       │  │
│                          └─────────────────┘  │
└──────────────────────────────────────────────┘
```
- Left column: month calendar grid (fixed width ~320px)
- Right column: time slots for selected date (flexible)
- Both visible simultaneously, no scrolling required

### Mobile (< 640px) — Stacked
- Full-width calendar on top
- Time slots appear below calendar when a date is selected
- User scrolls down to see and pick a time

## Component: `BookingCalendar.jsx`

**Props:**
```js
{
  slotDays: Array<{ date: string, duration_mins: number, slots: string[] }>,
  onSelect: (slot: string, duration_mins: number) => void,
  selectedSlot: string | null,
}
```

**Internal state:**
- `viewMonth` — YYYY-MM string for which month is displayed (starts at current month)
- `selectedDate` — YYYY-MM-DD string for the currently highlighted date

**Calendar grid:**
- 7-column grid (Sun–Sat header)
- Each cell is a day number; days outside the current month are dimmed/non-interactive
- Day states:
  - **Available** — has slots in `slotDays`, green dot indicator, clickable
  - **Unavailable** — no slots (day off or fully blocked), dimmed, not clickable
  - **Selected** — green fill background
  - **Today** — subtle white border outline
  - **Past** — dimmed, not clickable (days before tomorrow)
- Prev/Next month navigation arrows; can't go before current month

**Time slots panel:**
- Appears when a date is selected
- Shows date header: "MON, 26 MAY"
- Slots in a 2-column pill grid
- Selected slot: green fill; all others: dark bg with green border
- "No slots available" empty state (defensive, shouldn't show for clickable days)

## Data flow

`generateSlots` returns `slotDays` (array). In `TrainerProfilePage`, this is converted to a Map for O(1) lookup:

```js
const slotMap = useMemo(
  () => new Map(slotDays.map(d => [d.date, d])),
  [slotDays]
)
```

`BookingCalendar` receives `slotDays` and builds its own available-date Set internally.

## Post-selection flow (unchanged)

Picking a time slot calls `onSelect(slot, duration_mins)` → `selectedSlot` state in `TrainerProfilePage` updates → existing inline `VenuePicker` appears below the calendar section → "Book & Pay" → Stripe. No changes to checkout logic.

## Files changed

| File | Change |
|------|--------|
| `src/components/BookingCalendar.jsx` | **New** — calendar + time slot panel component |
| `src/utils/slotGenerator.js` | Fix multi-range bug: `find` → `filter` to handle multiple time ranges per day |
| `src/pages/TrainerProfilePage.jsx` | Replace flat slot list with `<BookingCalendar>`, add `slotMap` memo |

## Multi-range fix (slotGenerator.js)

Current bug: `availability.find(a => a.day_of_week === dayOfWeek)` only picks the first range per day. With multi-range availability (migration 010), a trainer can have e.g. 06:00–12:00 and 15:00–20:00 on Monday — the second range is silently dropped.

Fix: use `filter` to get all ranges for a day, generate slots for each range, concatenate.

## Out of scope
- Realtime slot updates (Supabase subscription) — data is fresh on page load
- Multi-session booking
- Duration selection UI (duration comes from trainer's availability row)
