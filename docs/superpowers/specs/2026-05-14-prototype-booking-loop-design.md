# FitnessGuru — Prototype Booking Loop Design

**Date:** 2026-05-14
**Status:** Approved

---

## Overview

Build a full end-to-end booking loop ready for real external testers. Clients discover trainers, pay upfront via Stripe, and receive a confirmed booking. Trainers see bookings in their dashboard and mark sessions complete. Manual payouts to trainers at this stage (no automated disbursement). A 24-hour cancellation window with automatic Stripe refund is enforced.

---

## Section 1: User Flows & Pages

### Client Flow

1. Client browses a real trainer listing page (replaces current mock data)
2. Client clicks a trainer card → `/trainer/:id` — full profile + available slots
3. Client selects a slot and clicks Book → Stripe Checkout (pay-to-book instantly)
4. Stripe redirects to `/booking/confirmed?booking_id=...` — confirmation page
5. Client can view all bookings at `/dashboard/client`
6. Client can cancel a booking (only if >24h before session) — refund issued automatically

### Trainer Flow

1. Trainer logs in → `/dashboard/trainer` — existing dashboard
2. Appointments tab shows real bookings from `bookings` table (client name, email, time, status)
3. Trainer marks a session as "Done" → status becomes `completed`
4. Admin manually pays the trainer out of band (Stripe Dashboard or bank transfer)

### Out of Scope for This Prototype

- Trainer accepting/rejecting individual bookings (all confirmed instantly on payment)
- In-app messaging between client and trainer
- Client ratings/reviews
- Automated trainer payouts

---

## Section 2: Data Model

### Bookings table changes (migration)

Add three columns to `public.bookings`:

| column | type | notes |
|---|---|---|
| `stripe_session_id` | text | Stripe Checkout Session ID |
| `stripe_payment_intent_id` | text | for refund calls |
| `amount_sgd` | int | amount charged in SGD cents |

The existing `bookings` table already has: `trainer_id`, `client_id`, `client_name`, `client_email`, `scheduled_at`, `duration_mins`, `status`, `notes`.

### RLS additions

- `trainer_profiles` — add public SELECT policy so unauthenticated visitors can read `approved` trainers
- `trainer_availability` — already has public read policy (migration 002)
- `bookings` — existing policies are sufficient

---

## Section 3: Pages & Edge Functions

### New Pages

| route | component | purpose |
|---|---|---|
| `/trainers` | `TrainerListingPage` | Browse approved trainers (real data) |
| `/trainer/:id` | `TrainerProfilePage` | Full trainer profile + slot picker |
| `/booking/confirmed` | `BookingConfirmedPage` | Post-payment confirmation |
| `/dashboard/client` | `ClientDashboardPage` | Client's booking history + cancel button |

### New Supabase Edge Functions

| function | trigger | action |
|---|---|---|
| `create-checkout` | POST from `/trainer/:id` slot picker | Create Stripe Checkout Session, insert pending booking row, return `session_url` |
| `stripe-webhook` | Stripe sends `checkout.session.completed` | Update booking `status` → `confirmed`, save `stripe_payment_intent_id` |
| `cancel-booking` | POST from client dashboard | Check 24h window, update status → `cancelled`, issue Stripe refund via `stripe.refunds.create` |

### Email Notifications

Extend the existing `notify-trainer` Edge Function (or add cases):
- `booking_confirmed` — sent to client on Stripe webhook completion
- `booking_cancelled` — sent to client and trainer on cancellation

---

## Section 4: Edge Cases & Error Handling

### Payment

- **Stripe Checkout abandoned** — booking row stays in a `pending` status; a scheduled cleanup job (or manual SQL) deletes stale pending rows older than 1 hour. The slot is not blocked while pending.
- **Webhook arrives before page redirect** — both paths are idempotent; `confirmed` status is safe to set twice.
- **Stripe Checkout fails** — user is redirected to `/trainer/:id?error=payment_failed`; no booking row is committed (it stays `pending` and is cleaned up).

### Cancellation

- **Within 24h of session** — cancel button is disabled on the client dashboard; tooltip explains the policy. No refund issued.
- **Trainer cancels** (future) — not in scope for this prototype. Admin handles manually.

### Slot Conflicts

- No double-booking guard at DB level for this prototype. Slots are shown based on the trainer's weekly `trainer_availability` template minus `availability_blocks` and any existing `confirmed` bookings. If two clients race to the same slot, the second payment goes through but creates an overlapping booking — admin resolves manually. A unique constraint will be added post-prototype.

### Auth

- `/trainer/:id` and `/trainers` are public (no login required to browse).
- Clicking "Book" while unauthenticated → redirect to `/login?redirect=/trainer/:id` with slot pre-selected in query params.
- `/dashboard/client` and `/booking/confirmed` require a valid session; unauthenticated users are sent to `/login`.

---

## Technical Notes

- **Stripe keys** stored as Supabase Edge Function secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- **Stripe mode** — test mode for prototype (`pk_test_...` / `sk_test_...`)
- `create-checkout` passes `metadata: { booking_id }` so the webhook can look up the row
- All Edge Functions follow the existing CORS pattern from `notify-trainer/index.ts`
- Frontend Stripe calls go through Edge Functions only — the publishable key is used client-side only for redirect, never the secret key
- Slot generation logic (available times from template minus blocks minus confirmed bookings) lives in a client-side utility function; no RPC needed at this scale

---

## Out of Scope

- Automated trainer payouts (Stripe Connect)
- Booking conflict unique constraint at DB level
- Trainer accept/reject flow
- Client ratings and reviews
- In-app chat
- Singpass / identity verification
