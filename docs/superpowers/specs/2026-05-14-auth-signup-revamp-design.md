# Auth & Signup Revamp — Design Spec
**Date:** 2026-05-14
**Status:** Approved — ready for implementation

## Overview

Revamp the entire auth entry experience to prioritise signup over login (growth-first for a new marketplace), add a full client registration flow, redesign the login page with role-aware tabs, and make all nav CTAs context-sensitive.

---

## Routes

| Route | Status | Description |
|---|---|---|
| `/signup` | New | Shared role-picker entry page |
| `/signup/client` | New | Client account creation (Step 1) |
| `/signup/client/profile` | New | Client profile setup (Steps 2–3) |
| `/signup/trainer` | Renamed from `/register/trainer` | Trainer account creation |
| `/register/trainer` | Redirect → `/signup/trainer` | Backwards-compat redirect |
| `/profile/setup` | Unchanged | Trainer profile setup (existing multi-step) |
| `/login` | Redesigned | Role-toggle login page |

---

## Navigation Changes

Nav CTA becomes context-aware based on active page role (`isTrainer` pattern already exists).

| Context | Primary CTA | Link | Secondary |
|---|---|---|---|
| SplitHero (no role) | None | — | — |
| Client page | "Create account" (green) | `/signup/client` | "Log in" (muted) → `/login?role=client` |
| Trainer page | "Apply as trainer" (amber) | `/signup/trainer` | "Log in" (muted) → `/login?role=trainer` |

"Log in" remains in the nav as a small muted link — visually de-emphasised. It is a utility for returning users, not a growth CTA.

---

## `/signup` — Shared Entry Page

For users arriving directly (shared links, Google, etc.).

Two large role-picker cards side by side (stacks vertically on mobile, client on top):

**Left card — Client (green accent)**
- Label: "I'm looking for a trainer"
- Subtext: "Create a free account and find your perfect match."
- CTA button: "Get started" → `/signup/client`

**Right card — Trainer (amber accent)**
- Label: "I'm a trainer"
- Subtext: "List your profile and grow your client base."
- CTA button: "Apply as trainer" → `/signup/trainer`

Footer link below both cards: "Already have an account? Log in" → `/login`

---

## Client Signup Flow

### Step 1 — Account creation (`/signup/client`)

Fields:
- Email (mandatory)
- Password (mandatory)
- Confirm password (mandatory)

On submit: creates Supabase auth user via `supabase.auth.signUp()`. On success, navigate to `/signup/client/profile`.

Footer: "Already have an account? [Log in →]" → `/login?role=client`

Progress indicator: Step 1 of 3

---

### Steps 2–3 — Profile setup (`/signup/client/profile`)

State managed client-side across both steps. Saved to Supabase on final step submission only.

**Step 2 — About you** (Step 2 of 3)

| Field | Mandatory |
|---|---|
| Full name | Yes |
| Phone | No |

**Step 3 — Your fitness** (Step 3 of 3)

| Field | Mandatory | Input type |
|---|---|---|
| Fitness goal | Yes | Single-select pill (5 options) |
| Preferred region | Yes | Single-select pill (5 regions) |
| Fitness level | No | Single-select pill (Beginner / Intermediate / Advanced) |

Fitness goal options (same as FeaturedTrainers chips):
- Lose weight
- Build muscle
- Train through pregnancy
- Improve sports performance
- Just start somewhere

Region options (same as FeaturedTrainers region pills):
- Central · East · West · North · North-East

On Step 3, a "Skip for now" link appears alongside the Next button — skips optional fields only; goal + region remain required.

**On completion:** Calls `upsert` on `profiles` table setting `role = 'client'`, `full_name`, `phone` (if provided). Saves `fitness_goal`, `preferred_region`, `fitness_level` to a new `client_profiles` table (see Data Layer). Then navigates to `/` (client page) with goal + region pre-applied as active filters via URL params or localStorage.

---

## Trainer Signup Flow

Existing flow renamed and re-routed — no functional changes.

`/register/trainer` → 301 redirect to `/signup/trainer`

`RegisterTrainerPage` updated to new path. All existing Step 1–5 logic preserved.

---

## Login Page Redesign (`/login`)

### Role toggle

Two tabs at the top of the card:

**Client tab** (default, green accent `#4ade80`)
- Heading: "Welcome back"
- Registration nudge: "Don't have an account? [Create one free →]" → `/signup/client`

**Trainer tab** (amber accent `#fbbf24`, background tint `#100e06`)
- Heading: "Trainer sign in"
- Registration nudge: "Not listed yet? [Apply as a trainer →]" → `/signup/trainer`

### Pre-selection via query param

`/login?role=trainer` opens with trainer tab active.
`/login?role=client` opens with client tab active (default if no param).

The nav "Log in" link passes the appropriate `?role=` param based on which page the user is on.

### Post-login redirect

After successful login, redirect based on `profile.role` regardless of which tab was selected:

| Role | Redirect |
|---|---|
| `client` | `/` (client page) |
| `trainer` | `/dashboard/trainer` |
| `admin` | `/admin` |

### Role mismatch

If a trainer logs in on the client tab (or vice versa), do not block — redirect correctly per `profile.role`. No error shown; the redirect is the implicit correction.

---

## Data Layer

### New table: `client_profiles`

```sql
create table public.client_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  fitness_goal text,
  preferred_region text,
  fitness_level text check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now() not null
);

alter table public.client_profiles enable row level security;

create policy "Clients manage own profile"
  on public.client_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

### `profiles` table

No new columns needed. `role = 'client'` is set during client profile completion.

---

## Post-Signup Client Navigation

After completing `/signup/client/profile`, navigate to `/` with goal and region pre-applied:

- Store `fitness_goal` and `preferred_region` in `localStorage` keys `fg_goal` and `fg_region`
- `FeaturedTrainers` reads these on mount and initialises `activeGoal` / `activeRegion` accordingly
- Keys are cleared after first read to avoid persisting stale filters on subsequent visits

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/pages/SignupEntryPage.jsx` | New — `/signup` role picker |
| `src/pages/ClientSignupPage.jsx` | New — `/signup/client` account creation |
| `src/pages/ClientProfileSetupPage.jsx` | New — `/signup/client/profile` 2-step profile |
| `src/pages/RegisterTrainerPage.jsx` | Rename route reference to `/signup/trainer` |
| `src/pages/LoginPage.jsx` | Redesign with role toggle + query param pre-selection |
| `src/App.jsx` | Add new routes, redirect `/register/trainer`, update nav CTAs |
| `supabase/migrations/003_client_profiles.sql` | New migration for `client_profiles` table |
