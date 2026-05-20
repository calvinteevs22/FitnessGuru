# Booking Confirmation Email + Calendar Invite — Design Spec
**Date:** 2026-05-20
**Status:** Approved

## Problem
After a client pays via Stripe, they receive a booking confirmation HTML email. The trainer receives nothing. Neither party gets a calendar invite — they have to manually add the session to their calendar.

## Goal
On `checkout.session.completed` (Stripe webhook):
1. Client receives their existing confirmation email **+ `.ics` calendar invite attachment**
2. Trainer receives a **new booking notification email + `.ics` calendar invite attachment**

## Approach
Extend the existing notification functions (Approach A). No new Edge Functions. Three files changed.

## ICS Generation

A `buildIcs()` helper is added to both `notify-booking` and `notify-trainer`. It accepts:
```ts
{
  uid: string          // bookingId + '@readyptsg.com' — deduplicates if resent
  dtstart: string      // ISO timestamp (scheduled_at from DB)
  durationMins: number
  summary: string      // e.g. "PT Session with Marcus Tan"
  description: string  // e.g. "Your 60-min session with Marcus Tan at Suntec Tower Gym"
  location: string     // venue_name
}
```

Returns a `.ics` string. Attached to Resend via:
```json
{ "attachments": [{ "filename": "session.ics", "content": "<btoa(ics)>" }] }
```

ICS format:
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ReadyPT//ReadyPT//EN
METHOD:PUBLISH
BEGIN:VEVENT
UID:<bookingId>@readyptsg.com
DTSTAMP:<now UTC: YYYYMMDDTHHmmssZ>
DTSTART:<scheduledAt UTC: YYYYMMDDTHHmmssZ>
DTEND:<scheduledAt+durationMins UTC: YYYYMMDDTHHmmssZ>
SUMMARY:<summary>
DESCRIPTION:<description>
LOCATION:<location>
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

## Files Changed

### `supabase/functions/notify-booking/index.ts`
- Accept `bookingId` in request body (used as ICS UID)
- Add `buildIcs()` helper
- When `status === 'booking_confirmed'`: generate `.ics`, add `attachments` array to Resend payload
- Cancellation emails: no `.ics` attachment (no event to add/remove)

### `supabase/functions/notify-trainer/index.ts`
- Add `buildIcs()` helper (same implementation)
- Add `status === 'booking_new'` handler:
  - Subject: `"New booking — ReadyPT"`
  - Body: client name, session time (SGT), venue, duration, amount earned
  - Attachment: `.ics` for the booked session
  - Accepted fields: `trainerName`, `trainerEmail`, `clientName`, `scheduledAt`, `durationMins`, `venueName`, `amountSgd`, `bookingId`

### `supabase/functions/stripe-webhook/index.ts`
- Expand DB query: `profiles!inner(full_name, email)` (currently only `full_name`)
- Pass `bookingId` to `notify-booking` (currently missing)
- Add fire-and-forget call to `notify-trainer` with `status: 'booking_new'` + trainer email + booking details

## Data Flow

```
Stripe: checkout.session.completed
  → stripe-webhook
    → DB: UPDATE bookings SET status='confirmed'
    → DB: SELECT booking + trainer profile (name + email)
    → notify-booking (client HTML email + .ics attachment)  [fire-and-forget]
    → notify-trainer booking_new (trainer HTML email + .ics attachment)  [fire-and-forget]
```

## Error Handling
- Both notification calls are fire-and-forget (`.catch(() => {})`) — email failure does not affect webhook response
- If `bookingId` is missing from `notify-booking` body, `.ics` UID falls back to a timestamp-based string so the email still sends
- If trainer email is not found in DB, `notify-trainer` call is skipped silently

## Out of Scope
- Cancellation calendar removal (CANCEL method ICS) — can be added later
- Trainer-initiated rescheduling
- Push notifications
