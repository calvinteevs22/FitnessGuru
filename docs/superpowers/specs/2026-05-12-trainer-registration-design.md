# FitnessGuru — Trainer Registration & Admin Design

**Date:** 2026-05-12
**Status:** Approved

---

## Overview

Add a fully functional trainer registration system to FitnessGuru. Trainers create real accounts, complete a multi-step profile, upload vetting documents, and await manual admin approval. The architecture is designed to support future client registration and scale without a dedicated backend server.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React/Vite (current codebase) |
| Routing | react-router-dom (new addition) |
| Backend/DB | Supabase (Postgres + Auth + Storage) |
| Hosting | Vercel (replaces GitHub Pages) |
| Environment vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (stored in Vercel, never committed) |

**How it fits together:** The React frontend calls Supabase directly via `@supabase/supabase-js`. No separate API server. Row Level Security (RLS) policies on Supabase enforce data access rules at the database layer. Vercel hosts the frontend with proper environment variable support.

---

## Database Schema

### `profiles`
One row per user — shared base for all user types (trainers, clients, admins).

| column | type | notes |
|---|---|---|
| id | uuid | FK to auth.users.id, primary key |
| role | text | `'trainer'`, `'client'`, or `'admin'` |
| full_name | text | |
| phone | text | |
| profile_photo_url | text | points to Supabase Storage `profile-photos` bucket |
| bio | text | |
| created_at | timestamptz | auto-set |

### `trainer_profiles`
One row per trainer — extends `profiles` with trainer-specific fields.

| column | type | notes |
|---|---|---|
| id | uuid | FK to profiles.id, primary key |
| certifications | text[] | array of certification names |
| specialties | text[] | e.g. `['strength', 'HIIT', 'yoga']` |
| years_experience | int | |
| hourly_rate | int | in SGD |
| session_types | text[] | `['in-person', 'virtual']` |
| locations_served | text[] | e.g. `['Orchard', 'CBD', 'Online']` |
| documents | jsonb | structured document URLs (see below) |
| status | text | `'pending'`, `'approved'`, `'rejected'` |
| admin_notes | text | internal notes set by admin on review |
| reviewed_at | timestamptz | set when admin approves or rejects |
| created_at | timestamptz | auto-set |

**`documents` jsonb structure:**
```json
{
  "certifications": ["url1", "url2"],
  "government_id": ["url"],
  "cpr_cert": ["url"],
  "insurance": ["url"]
}
```

Using jsonb keeps the schema clean and makes it easy to add document types later without a migration.

### File Storage Buckets

| bucket | contents |
|---|---|
| `profile-photos` | Trainer profile photos. Path: `{user_id}/photo.{ext}` |
| `documents` | All vetting documents. Path: `{user_id}/{type}/{filename}` |

Document upload constraints (enforced on frontend + Supabase bucket policy):
- Accepted formats: PDF, JPG, PNG
- Max 5MB per file
- Max 5 files per document type

---

## Document Requirements

Documents collected at registration for trainer vetting:

| document | required | notes |
|---|---|---|
| Fitness certifications | Yes | NASM, ACE, SSC, ACSM, etc. |
| Government-issued ID | Yes | NRIC for citizens/PRs, passport + work pass for foreigners |
| CPR / First Aid cert | Yes | Standard requirement for fitness professionals |
| Professional liability insurance | Soft | Requested but admin can approve without it at MVP |

**Identity verification:** Manual upload at MVP. Singpass MyInfo is the planned upgrade path once the business has a registered UEN and GovTech onboarding is complete.

---

## Auth & Registration Flow

### New Routes

| route | purpose |
|---|---|
| `/register/trainer` | Multi-step registration form |
| `/verify` | Post-signup email verification holding page |
| `/profile/setup` | Profile completion form (requires verified email) |
| `/dashboard/trainer` | Trainer's own profile and status view |
| `/admin` | Admin dashboard |
| `/login` | Shared login page for all roles |

### Trainer Registration Steps

1. Trainer clicks **"Apply as a Trainer"** on the trainer landing page → navigates to `/register/trainer`
2. **Step 1 — Account:** email + password. Supabase sends a verification email. Trainer lands on `/verify` with message: "Check your inbox to continue."
3. Trainer clicks the email verification link → redirected to `/profile/setup`
4. **Step 2 — Basic info:** full name, phone, profile photo upload
5. **Step 3 — Professional:** certification names (free-text tags), specialties (multi-select), years of experience, certification file uploads
6. **Step 4 — Documents:** government ID upload, CPR cert upload, insurance upload (marked optional)
7. **Step 5 — Commercial:** hourly rate, session types (multi-select), locations served (multi-select), short bio
8. On submit:
   - Row written to `profiles` with `role = 'trainer'`
   - Row written to `trainer_profiles` with `status = 'pending'`
   - Files uploaded to Supabase Storage, URLs saved in `documents` jsonb
9. Trainer sees confirmation: *"Application submitted. We'll review your profile and get back to you within 48 hours."*
10. Trainer can return to `/dashboard/trainer` to check their status at any time

**Email verification enforcement:** `/profile/setup` checks that a valid Supabase session exists and the email is verified before rendering. Unverified users are redirected to `/verify`.

### Future Client Registration

Same pattern — `/register/client` → account creation → `profiles` row with `role = 'client'`. No trainer-specific steps or documents needed.

---

## Admin Dashboard

**Route:** `/admin`

**Access control:** Any `profiles` row with `role = 'admin'` gets full access. Admin accounts are created manually in the Supabase dashboard — there is no public signup path for admins. All co-founder admin accounts have equal access.

**Layout:** Three tabs — Pending, Approved, Rejected.

Each trainer card shows:
- Name, photo, email, phone
- Specialties, years of experience, hourly rate
- Session types, locations served
- Bio
- Documents section — download/view links for each uploaded file, organised by type
- Admin notes field — free text for internal notes
- **Approve** and **Reject** buttons (Pending tab only)

**On approve:**
- `status` → `'approved'`, `reviewed_at` set to now
- A Supabase Edge Function is triggered by the status update and sends a notification email to the trainer via Resend (free tier: 3,000 emails/month): "Your FitnessGuru profile has been approved."

**On reject:**
- `status` → `'rejected'`, `reviewed_at` set to now, `admin_notes` saved
- The same Edge Function sends a rejection email to the trainer: "Your application was not approved at this time." with the admin note included.

**Email infrastructure:** Resend is used for transactional email. One Supabase Edge Function handles both approve and reject notifications. Supabase's built-in auth emails (verification, password reset) remain unchanged.

**RLS policy:** Only users with `role = 'admin'` can read `trainer_profiles` rows with `status = 'pending'` or update the `status` field. Trainers can only read their own row.

---

## Trainer Dashboard (`/dashboard/trainer`)

**Access:** Logged-in users with `role = 'trainer'` only.

**Contents:**
- **Status banner** — clearly displays current status: pending / approved / rejected. If rejected, displays the admin note.
- **Profile preview** — how the profile will appear to clients once the marketplace launches
- **Edit profile** — trainer can update bio, rates, session types, locations, specialties. Edits reset `status` to `'pending'` and trigger re-review.
- **Documents** — list of uploaded documents with ability to replace or upload additional files
- **Account settings** — change email and password

**Not included at MVP:** booking management, client messaging, earnings/payouts, calendar. These are added when the marketplace goes live.

---

## Hosting Migration

The site moves from GitHub Pages to Vercel.

- Connect the GitHub repo to Vercel
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel environment variables
- Update `vite.config.js` — remove the `base: '/FitnessGuru/'` path (Vercel serves from root)
- Remove or disable the GitHub Actions Pages workflow

---

## Out of Scope

- Trainer search / browse / directory for clients
- Booking flow
- Payments and payouts
- Client registration (architecture supports it, implementation deferred)
- Singpass MyInfo integration (planned for after business UEN registration)
- Role-based admin permissions (all admins have equal access at MVP)
- Email templates (Supabase default emails used at MVP)
