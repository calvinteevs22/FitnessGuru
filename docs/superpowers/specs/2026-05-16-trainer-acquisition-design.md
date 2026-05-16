# Trainer Acquisition — Design Spec

**Goal:** Reduce friction in the trainer signup funnel and increase the share of applicants who complete the full application and go live on the platform.

**Approach:** Two-phase "Try Before You Apply" — trainers build a visible profile first (Phase 1), then submit verification documents (Phase 2). A live split-screen preview during Phase 1 shows the trainer exactly how clients will see them, making the value of completing the application tangible. After submission, an application status tracker guides them through approval and gates going live behind an availability setup step.

---

## Flow Overview

```
[RegisterTrainerPage] ─── Step A (existing)
        │
        ▼
[ProfileSetupPage]
  Phase 1 — Build your profile
    Step B: Identity     (name, photo, phone)
    Step C: Professional (specialties, years of experience)
    Step D: Commercial   (hourly rate, locations, bio)
        │
        │  CTA: "This is how clients will see you. Ready to get verified?"
        ▼
  Phase 2 — Get verified
    Step E: Certifications (cert name + file upload, repeatable)
    Step F: Compliance     (gov ID, CPR/First Aid cert, optional insurance)
        │
        ▼
[ApplicationStatusPage]
```

---

## Phase 1 — Build Your Profile

Steps B, C, and D replace the existing monolithic ProfileSetupPage. All three steps render with a **live split-screen preview** (left = form, right = TrainerProfilePreview card).

**Step B — Identity**
- Full name (text)
- Profile photo (file upload, image only; falls back to initials monogram if empty)
- Phone number (text, private — never shown on preview)

**Step C — Professional**
- Specialties (multi-select from predefined list: Strength, HIIT, Yoga, Pilates, Rehabilitation, Sports Performance, Weight Loss, Nutrition)
- Years of experience (number input, min 0)

**Step D — Commercial**
- Hourly rate (number input, SGD)
- Locations served (multi-select from predefined area list: Orchard, Novena, Buona Vista, etc.)
- Bio (textarea, max 300 chars with live char count)

At the end of Step D, when all required fields are filled, the CTA label changes from "Continue" to "This is how clients will see you — ready to get verified?" with a green highlight. This is the only moment the CTA draws attention to the preview outcome.

---

## Live Profile Preview — TrainerProfilePreview Component

Renders from Step B onward. The card is a read-only replica of the client-facing trainer card.

**Layout:**
- Desktop: split-screen — form fills left half, preview card fills right half, sticky while scrolling
- Mobile: preview collapses below the form; only visible once the trainer has entered at least their name

**Field → preview mapping:**

| Form field | Preview element |
|---|---|
| Full name | Name header |
| Profile photo | Avatar (initials monogram fallback) |
| Specialties | Tag pills below name |
| Years of experience | "X yrs experience" badge |
| Hourly rate | "$X/hr" in card footer |
| Locations | "Location1, Location2" below rate |
| Bio | 2-line truncated text with ellipsis |
| Phone | Not displayed (private) |

**Update behavior:** Preview re-renders on every `onChange` — local React state, no API calls, no debounce. Empty fields render styled gray placeholder bars so the card always looks like a card, never broken.

**Completion indicator:** A progress bar at the top of the preview card fills as fields are completed. At 100% (all required Phase 1 fields filled), the bar turns green and the CTA text updates as described above.

**Component:** `TrainerProfilePreview` — pure presentational, accepts a `profile` prop object, renders the card. Lives alongside ProfileSetupPage in `src/pages/`.

---

## Phase 2 — Get Verified

Steps E and F. No preview panel — these are document upload steps.

**Step E — Certifications**
- Cert name (text) + file upload (PDF or image), repeatable via "Add another certification" link
- At least one certification required to proceed

**Step F — Compliance**
- Government-issued photo ID (file upload, required)
- CPR/First Aid certificate (file upload, required)
- Liability insurance (file upload, optional — labeled "optional but recommended")

On submit of Step F: trainer record status set to `pending` in Supabase, redirect to ApplicationStatusPage.

---

## Application Status Page — ApplicationStatusPage

Route: `/trainer/application-status`

Visible to trainers whose status is `pending`, `docs_verified`, or `approved`. Once status is `live`, redirect to trainer dashboard.

**Status states and UI:**

| Supabase status | Progress dots | Message | CTA |
|---|---|---|---|
| `pending` | 1/4 filled | "Under review — usually 3–5 business days" | Preview profile |
| `docs_verified` | 2/4 filled | "Documents verified — final approval in progress" | Preview profile |
| `approved` | 3/4 filled | "Approved! Set your availability to go live" | **Set availability (required)** |
| `live` | 4/4 filled | Redirect to dashboard | — |
| `rejected` | Red indicator | Rejection reason shown | Re-upload documents |

**Availability gate (approved state):**
When status is `approved`, the only CTA is "Set your first available slots to go live." This links to the existing availability picker in the trainer dashboard. The trainer's profile does not become discoverable until they have saved at least one available time slot. On save, status transitions to `live` and the trainer is redirected to the dashboard.

This prevents approved-but-never-live dropout — the platform drives the trainer directly into the action that makes them monetisable.

**Reference number:** Displayed on the page (`Ref #RPT-XXXXX`) for support queries.

**Email triggers (via Resend):** One transactional email per status change (`pending` → `docs_verified`, `docs_verified` → `approved`, any → `rejected`). Each email links directly back to ApplicationStatusPage.

---

## Data Model Changes

**`trainers` table — new/modified columns:**

| Column | Type | Notes |
|---|---|---|
| `application_status` | enum | `pending`, `docs_verified`, `approved`, `live`, `rejected` |
| `rejection_reason` | text | Nullable; set by admin on rejection |
| `application_ref` | text | Generated on Phase 2 submit, format `RPT-XXXXX` |
| `docs_submitted_at` | timestamptz | Set on Phase 2 submit |
| `approved_at` | timestamptz | Set when admin approves |
| `live_at` | timestamptz | Set when trainer saves first availability slot |

Existing columns (name, photo, specialties, rate, bio, locations, certifications) remain. The Phase 1/2 split uses them as-is.

---

## Files

| Action | File | Notes |
|---|---|---|
| Modify | `src/pages/ProfileSetupPage.jsx` | Restructure into Phase 1 (B/C/D) + Phase 2 (E/F) |
| Create | `src/pages/ApplicationStatusPage.jsx` | New page, route `/trainer/application-status` |
| Create | `src/components/TrainerProfilePreview.jsx` | Presentational card, used by ProfileSetupPage |
| Modify | `src/App.jsx` | Add route for ApplicationStatusPage |
| Modify | `supabase/migrations/` | Add new columns to trainers table |

---

## Out of Scope

- Admin dashboard for reviewing applications (manual review via Supabase dashboard for now)
- Trainer-to-trainer referral program
- Re-engagement email for Phase 1 → Phase 2 abandonment (deprioritised)
- Preview profile sharing link with waitlist capture (deprioritised)
