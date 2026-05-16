# Trainer Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the two-phase trainer application flow — live profile preview during signup, post-submission status tracker, and an availability gate that blocks profile discovery until the first slot is set.

**Architecture:** `ProfileSetupPage` is restructured into 5 steps (B=Identity, C=Professional, D=Commercial, E=Certifications, F=Compliance). Steps B–D show a split-screen `TrainerProfilePreview` card updating in real-time. On Phase 2 submit, trainer lands on `ApplicationStatusPage` which polls `trainer_profiles.status` every 30 seconds. Approved trainers must save at least one availability slot before status transitions to `live`. A new `set_trainer_live()` Supabase RPC handles that transition.

**Tech Stack:** React 19, Vite, inline styles, Supabase (Postgres + RLS + Edge Functions), React Router v6, Vitest + React Testing Library (jsdom)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/009_trainer_application_status.sql` | Expand status enum, add tracking columns, update RPCs |
| Create | `src/components/TrainerProfilePreview.jsx` | Presentational live-preview card |
| Create | `src/components/TrainerProfilePreview.test.jsx` | Tests for preview card |
| Modify | `src/pages/ProfileSetupPage.jsx` | Full restructure: Phase 1 (B/C/D with preview) + Phase 2 (E/F) |
| Create | `src/pages/ApplicationStatusPage.jsx` | Status tracker page |
| Create | `src/pages/ApplicationStatusPage.test.jsx` | Tests for status page |
| Modify | `src/App.jsx` | Add `/trainer/application-status` route |
| Modify | `src/pages/TrainerDashboardPage.jsx` | Call `set_trainer_live` when first availability slot saved |

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/009_trainer_application_status.sql`

The existing `trainer_profiles.status` check constraint only allows `pending`, `approved`, `rejected`. We need to add `docs_verified` and `live`, plus five new tracking columns and an updated `submit_trainer_profile` RPC (which now returns the generated `application_ref`), plus a new `set_trainer_live` RPC.

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/009_trainer_application_status.sql

-- 1. Expand the status check constraint
--    The existing constraint name is trainer_profiles_status_check (Postgres auto-names it).
--    If the apply step fails, find the real name with:
--    SELECT conname FROM pg_constraint WHERE conrelid = 'public.trainer_profiles'::regclass AND contype = 'c';
alter table public.trainer_profiles
  drop constraint trainer_profiles_status_check;

alter table public.trainer_profiles
  add constraint trainer_profiles_status_check
  check (status in ('pending', 'docs_verified', 'approved', 'live', 'rejected'));

-- 2. Add new tracking columns
alter table public.trainer_profiles
  add column if not exists rejection_reason text,
  add column if not exists application_ref   text,
  add column if not exists docs_submitted_at timestamptz,
  add column if not exists approved_at       timestamptz,
  add column if not exists live_at           timestamptz;

-- 3. Update submit_trainer_profile to return application_ref and set docs_submitted_at
--    Signature change: returns text instead of void.
--    The frontend call (supabase.rpc) will now receive { data: 'RPT-XXXXX', error: null }.
create or replace function public.submit_trainer_profile(
  p_full_name        text,
  p_phone            text,
  p_email            text,
  p_profile_photo_url text,
  p_bio              text,
  p_certifications   text[],
  p_specialties      text[],
  p_years_experience int,
  p_hourly_rate      int,
  p_session_types    text[],
  p_locations_served text[],
  p_documents        jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  v_ref text;
begin
  -- Preserve existing ref on resubmit; generate new one for first submission
  select application_ref into v_ref
  from public.trainer_profiles where id = auth.uid();

  if v_ref is null then
    v_ref := 'RPT-' || lpad((floor(random() * 99999) + 1)::text, 5, '0');
  end if;

  insert into public.profiles (id, role, full_name, phone, email, profile_photo_url, bio)
  values (auth.uid(), 'trainer', p_full_name, p_phone, p_email, p_profile_photo_url, p_bio)
  on conflict (id) do update set
    role              = 'trainer',
    full_name         = excluded.full_name,
    phone             = excluded.phone,
    email             = excluded.email,
    profile_photo_url = excluded.profile_photo_url,
    bio               = excluded.bio;

  insert into public.trainer_profiles (
    id, certifications, specialties, years_experience, hourly_rate,
    session_types, locations_served, documents, status,
    application_ref, docs_submitted_at
  )
  values (
    auth.uid(), p_certifications, p_specialties, p_years_experience, p_hourly_rate,
    p_session_types, p_locations_served, p_documents, 'pending',
    v_ref, now()
  )
  on conflict (id) do update set
    certifications    = excluded.certifications,
    specialties       = excluded.specialties,
    years_experience  = excluded.years_experience,
    hourly_rate       = excluded.hourly_rate,
    session_types     = excluded.session_types,
    locations_served  = excluded.locations_served,
    documents         = excluded.documents,
    status            = 'pending',
    application_ref   = v_ref,
    docs_submitted_at = now(),
    reviewed_at       = null,
    admin_notes       = null,
    rejection_reason  = null;

  return v_ref;
end;
$$;

-- 4. New RPC: transition approved trainer to live when first availability slot saved
create or replace function public.set_trainer_live()
returns void
language plpgsql
security definer
as $$
begin
  update public.trainer_profiles
  set status  = 'live',
      live_at = now()
  where id = auth.uid()
    and status = 'approved';
end;
$$;
```

- [ ] **Step 2: Apply migration to Supabase**

Run:
```bash
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx supabase db push --project-ref wnwmlaqhyztwxyvzuqpe
```
Expected: Migration applied with no errors.

- [ ] **Step 3: Verify new columns exist**

In the Supabase dashboard SQL editor, run:
```sql
select column_name, data_type
from information_schema.columns
where table_name = 'trainer_profiles'
order by ordinal_position;
```
Expected: `rejection_reason`, `application_ref`, `docs_submitted_at`, `approved_at`, `live_at` appear.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/009_trainer_application_status.sql
git commit -m "feat: expand trainer_profiles schema — status enum, tracking columns, updated RPCs"
```

---

### Task 2: TrainerProfilePreview component

**Files:**
- Create: `src/components/TrainerProfilePreview.jsx`
- Create: `src/components/TrainerProfilePreview.test.jsx`

Pure presentational card. Accepts a `profile` prop object, renders a read-only client-facing card with placeholder bars for empty fields and a completion progress bar.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/TrainerProfilePreview.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TrainerProfilePreview from './TrainerProfilePreview'

describe('TrainerProfilePreview', () => {
  it('renders "Client preview" label', () => {
    render(<TrainerProfilePreview profile={{}} />)
    expect(screen.getByText('Client preview')).toBeInTheDocument()
  })

  it('renders name when provided', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [] }} />)
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
  })

  it('renders two-letter initials from name when no photo', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [] }} />)
    expect(screen.getByText('JL')).toBeInTheDocument()
  })

  it('renders single-letter initial for single-word name', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan', specialties: [], locations: [] }} />)
    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('renders specialties as pills', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: ['Strength', 'HIIT'], locations: [] }} />)
    expect(screen.getByText('Strength')).toBeInTheDocument()
    expect(screen.getByText('HIIT')).toBeInTheDocument()
  })

  it('renders hourly rate in footer', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: [], hourlyRate: '85' }} />)
    expect(screen.getByText('$85/hr')).toBeInTheDocument()
  })

  it('renders locations in footer (max 2, then +N)', () => {
    render(<TrainerProfilePreview profile={{ name: 'Jordan Lee', specialties: [], locations: ['Orchard', 'Novena', 'CBD'] }} />)
    expect(screen.getByText(/Orchard.*Novena.*\+1/)).toBeInTheDocument()
  })

  it('renders singular "yr experience" for yearsExp=1', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], yearsExp: '1' }} />)
    expect(screen.getByText('1 yr experience')).toBeInTheDocument()
  })

  it('renders plural "yrs experience" for yearsExp=3', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], yearsExp: '3' }} />)
    expect(screen.getByText('3 yrs experience')).toBeInTheDocument()
  })

  it('renders bio text truncated to 2 lines', () => {
    render(<TrainerProfilePreview profile={{ name: 'J', specialties: [], locations: [], bio: 'Great trainer.' }} />)
    expect(screen.getByText('Great trainer.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/TrainerProfilePreview.test.jsx`
Expected: FAIL with `Cannot find module './TrainerProfilePreview'`

- [ ] **Step 3: Create the component**

```jsx
// src/components/TrainerProfilePreview.jsx

function PlaceholderBar({ width }) {
  return (
    <div style={{ height: 14, width, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }} />
  )
}

export default function TrainerProfilePreview({ profile = {} }) {
  const {
    name = '',
    photoUrl = '',
    specialties = [],
    yearsExp = '',
    hourlyRate = '',
    locations = [],
    bio = '',
  } = profile

  const requiredFields = [
    !!name.trim(),
    !!photoUrl,
    specialties.length > 0,
    !!yearsExp,
    !!hourlyRate,
    locations.length > 0,
    !!bio.trim(),
  ]
  const filled = requiredFields.filter(Boolean).length
  const pct = Math.round((filled / requiredFields.length) * 100)
  const isComplete = pct === 100

  const initials = name.trim()
    ? name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const displayLocations = locations.length > 0
    ? locations.slice(0, 2).join(', ') + (locations.length > 2 ? ` +${locations.length - 2}` : '')
    : null

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(238,242,238,0.1)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Completion progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: isComplete ? '#4ade80' : '#2D6A27',
          transition: 'width 0.2s ease',
        }} />
      </div>

      <div style={{ padding: '24px 24px 20px' }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(238,242,238,0.35)', margin: '0 0 16px',
        }}>
          Client preview
        </p>

        {/* Avatar + name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg, #14532d, #166534)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#EEF2EE' }}>{initials}</span>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {name.trim()
              ? <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, color: '#EEF2EE', margin: 0 }}>{name.trim()}</p>
              : <PlaceholderBar width="70%" />
            }
            <div style={{ marginTop: 6 }}>
              {yearsExp
                ? <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', margin: 0 }}>
                    {yearsExp} yr{Number(yearsExp) !== 1 ? 's' : ''} experience
                  </p>
                : <PlaceholderBar width="40%" />
              }
            </div>
          </div>
        </div>

        {/* Specialties */}
        {specialties.length > 0
          ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {specialties.map(s => (
                <span key={s} style={{
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)',
                  borderRadius: 20, padding: '3px 10px',
                  fontFamily: 'var(--font-body)', fontSize: 12, color: '#4ade80',
                }}>
                  {s}
                </span>
              ))}
            </div>
          : <div style={{ marginBottom: 12 }}><PlaceholderBar width="80%" /></div>
        }

        {/* Bio */}
        {bio.trim()
          ? <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.65)',
              lineHeight: 1.6, margin: '0 0 16px',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {bio.trim()}
            </p>
          : <div style={{ marginBottom: 16 }}>
              <PlaceholderBar width="100%" />
              <div style={{ marginTop: 6 }}><PlaceholderBar width="75%" /></div>
            </div>
        }

        {/* Footer: locations + rate */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {displayLocations
              ? <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', margin: 0 }}>
                  {'\u{1F4CD}'} {displayLocations}
                </p>
              : <PlaceholderBar width="50%" />
            }
          </div>
          <div style={{ flexShrink: 0 }}>
            {hourlyRate
              ? <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', margin: 0 }}>${hourlyRate}/hr</p>
              : <PlaceholderBar width="48px" />
            }
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/TrainerProfilePreview.test.jsx`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/TrainerProfilePreview.jsx src/components/TrainerProfilePreview.test.jsx
git commit -m "feat: add TrainerProfilePreview presentational component"
```

---

### Task 3: ProfileSetupPage — complete restructure

**Files:**
- Modify: `src/pages/ProfileSetupPage.jsx`

Replace the existing 4-step monolith (steps 2–5) with a 5-step flow using internal step numbers 1–5:
- Step 1 (B): Identity — name, phone, profile photo
- Step 2 (C): Professional — specialties, years of experience
- Step 3 (D): Commercial — hourly rate, locations, bio
- Step 4 (E): Certifications — repeatable name+file pairs (at least one required)
- Step 5 (F): Compliance — gov ID, CPR cert, optional insurance

Steps 1–3 show `TrainerProfilePreview` in a split-screen layout (sticky on desktop, below form on mobile after name is typed). Steps 4–5 do not show the preview.

On Step 3, when all Phase 1 required fields are filled, the CTA text changes to "This is how clients will see you — ready to get verified?" with a green glow.

On submit (Step 5), the RPC is called, `notify-trainer` edge function fires, and the trainer is redirected to `/trainer/application-status`.

- [ ] **Step 1: Read the current file before replacing it**

Run: `wc -l src/pages/ProfileSetupPage.jsx`
(Confirms it's the 310-line version known to this plan. If it differs significantly, read it fully and reconcile before proceeding.)

- [ ] **Step 2: Replace ProfileSetupPage.jsx**

```jsx
// src/pages/ProfileSetupPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { validateRequired } from '../utils/validation'
import FileUpload from '../components/FileUpload'
import MultiSelect from '../components/MultiSelect'
import TrainerProfilePreview from '../components/TrainerProfilePreview'

const SPECIALTIES = ['Strength', 'HIIT', 'Yoga', 'Pilates', 'Rehabilitation', 'Sports Performance', 'Weight Loss', 'Nutrition']
const LOCATIONS = ['Central', 'CBD', 'Orchard', 'East', 'West', 'North', 'Northeast', 'Buona Vista', 'Novena', 'Online']

const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', padding: '40px 16px',
  display: 'flex', justifyContent: 'center',
}

const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
  borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 520,
  height: 'fit-content',
}

const LABEL_STYLE = { display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, marginBottom: 6 }
const INPUT_STYLE = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
const BTN_PRIMARY = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }
const BTN_GHOST = { background: 'transparent', color: 'rgba(238,242,238,0.6)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '12px 24px', fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-body)' }
const ERR_STYLE = { color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }

const STEP_TITLES = ['Identity', 'Professional', 'Commercial', 'Certifications', 'Compliance']

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  // Step 1 (B) — Identity
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')

  // Step 2 (C) — Professional
  const [specialties, setSpecialties] = useState([])
  const [yearsExp, setYearsExp] = useState('')

  // Step 3 (D) — Commercial
  const [hourlyRate, setHourlyRate] = useState('')
  const [locations, setLocations] = useState([])
  const [bio, setBio] = useState('')

  // Step 4 (E) — Certifications: each entry is { name: string, file: File|null }
  const [certEntries, setCertEntries] = useState([{ name: '', file: null }])

  // Step 5 (F) — Compliance
  const [govIdFiles, setGovIdFiles] = useState([])
  const [cprFiles, setCprFiles] = useState([])
  const [insuranceFiles, setInsuranceFiles] = useState([])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Generate/revoke object URL for photo preview
  useEffect(() => {
    if (photoFiles[0]) {
      const url = URL.createObjectURL(photoFiles[0])
      setPhotoPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPhotoPreviewUrl('')
  }, [photoFiles])

  // Preview card data (Phase 1 fields only)
  const previewProfile = { name: fullName, photoUrl: photoPreviewUrl, specialties, yearsExp, hourlyRate, locations, bio }

  // All Phase 1 required fields filled → special CTA on Step 3
  const phase1Complete = !!(
    fullName.trim() && photoFiles.length > 0 &&
    specialties.length > 0 && yearsExp &&
    hourlyRate && locations.length > 0 && bio.trim()
  )

  function validateStep1() {
    const errs = {}
    const nameErr = validateRequired(fullName, 'Full name')
    const phoneErr = validateRequired(phone, 'Phone number')
    if (nameErr) errs.fullName = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (photoFiles.length === 0) errs.photo = 'Profile photo is required.'
    return errs
  }

  function validateStep2() {
    const errs = {}
    if (specialties.length === 0) errs.specialties = 'Select at least one specialty.'
    const expErr = validateRequired(yearsExp, 'Years of experience')
    if (expErr) errs.yearsExp = expErr
    return errs
  }

  function validateStep3() {
    const errs = {}
    const rateErr = validateRequired(hourlyRate, 'Hourly rate')
    if (rateErr) errs.hourlyRate = rateErr
    else if (isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid rate in SGD.'
    if (locations.length === 0) errs.locations = 'Select at least one location.'
    const bioErr = validateRequired(bio, 'Bio')
    if (bioErr) errs.bio = bioErr
    return errs
  }

  function validateStep4() {
    const errs = {}
    const hasValidEntry = certEntries.some(e => e.name.trim() && e.file)
    if (!hasValidEntry) errs.certEntries = 'Add at least one certification with a name and document.'
    return errs
  }

  function validateStep5() {
    const errs = {}
    if (govIdFiles.length === 0) errs.govId = 'Government ID is required.'
    if (cprFiles.length === 0) errs.cpr = 'CPR/First Aid certificate is required.'
    return errs
  }

  function handleNext() {
    let errs = {}
    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()
    if (step === 3) errs = validateStep3()
    if (step === 4) errs = validateStep4()
    setErrors(errs)
    if (Object.keys(errs).length === 0) { setStep(s => s + 1); setErrors({}) }
  }

  async function uploadFiles(bucket, userId, type, files) {
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleSubmit() {
    if (submitting) return
    const errs = validateStep5()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setServerError('')

    try {
      const userId = session.user.id

      const [profilePhotoUrl] = await uploadFiles('profile-photos', userId, 'photo', photoFiles)

      const certFiles = certEntries.map(e => e.file).filter(Boolean)
      const certNames = certEntries.map(e => e.name.trim()).filter(Boolean)
      const certUrls = await uploadFiles('documents', userId, 'certifications', certFiles)

      const govIdUrls = await uploadFiles('documents', userId, 'government_id', govIdFiles)
      const cprUrls = await uploadFiles('documents', userId, 'cpr_cert', cprFiles)
      const insuranceUrls = insuranceFiles.length > 0
        ? await uploadFiles('documents', userId, 'insurance', insuranceFiles)
        : []

      const documents = {
        certifications: certUrls,
        government_id: govIdUrls,
        cpr_cert: cprUrls,
        insurance: insuranceUrls,
      }

      const { error } = await supabase.rpc('submit_trainer_profile', {
        p_full_name:         fullName.trim(),
        p_phone:             phone.trim(),
        p_email:             session.user.email,
        p_profile_photo_url: profilePhotoUrl,
        p_bio:               bio.trim(),
        p_certifications:    certNames,
        p_specialties:       specialties,
        p_years_experience:  parseInt(yearsExp, 10),
        p_hourly_rate:       Number(hourlyRate),
        p_session_types:     ['In-person', 'Virtual'],
        p_locations_served:  locations,
        p_documents:         documents,
      })

      if (error) throw new Error(error.message)

      // Fire submission notification — non-blocking
      supabase.functions.invoke('notify-trainer', {
        body: {
          trainerName:  fullName.trim(),
          trainerEmail: session.user.email,
          status:       'submitted',
        },
      }).catch(() => {})

      navigate('/trainer/application-status')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function addCertEntry() {
    setCertEntries(prev => [...prev, { name: '', file: null }])
  }

  function updateCertEntry(index, field, value) {
    setCertEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function removeCertEntry(index) {
    setCertEntries(prev => prev.filter((_, i) => i !== index))
  }

  const isPhase1 = step <= 3
  const stepPct = (step / 5) * 100
  const showPreview = isPhase1 && (!isMobile || fullName.trim())

  const ctaLabel = step === 3 && phase1Complete
    ? 'This is how clients will see you — ready to get verified?'
    : 'Continue'
  const ctaStyle = step === 3 && phase1Complete
    ? { ...BTN_PRIMARY, boxShadow: '0 0 16px rgba(74,222,128,0.3)' }
    : BTN_PRIMARY

  return (
    <div style={PAGE_STYLE}>
      <div style={{
        display: 'flex',
        gap: 40,
        width: '100%',
        maxWidth: isPhase1 ? 960 : 520,
        alignItems: 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {/* Form card */}
        <div style={CARD_STYLE}>
          {/* Progress indicator */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 6px 0' }}>
              Step {step} of 5 — {STEP_TITLES[step - 1]}
            </p>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${stepPct}%`, background: '#4ade80', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {/* Step 1 (B) — Identity */}
          {step === 1 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Tell us about yourself</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Full name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} style={INPUT_STYLE} placeholder="Jordan Lee" />
                {errors.fullName && <p style={ERR_STYLE}>{errors.fullName}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Phone number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} placeholder="+65 9xxx xxxx" />
                {errors.phone && <p style={ERR_STYLE}>{errors.phone}</p>}
              </div>
              <FileUpload label="Profile photo" files={photoFiles} onChange={setPhotoFiles} maxFiles={1} required />
              {errors.photo && <p style={ERR_STYLE}>{errors.photo}</p>}
            </>
          )}

          {/* Step 2 (C) — Professional */}
          {step === 2 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your expertise</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Specialties</label>
                <MultiSelect options={SPECIALTIES} selected={specialties} onChange={setSpecialties} />
                {errors.specialties && <p style={ERR_STYLE}>{errors.specialties}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Years of experience</label>
                <input type="number" min="0" max="50" value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} placeholder="0" />
                {errors.yearsExp && <p style={ERR_STYLE}>{errors.yearsExp}</p>}
              </div>
            </>
          )}

          {/* Step 3 (D) — Commercial */}
          {step === 3 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your offering</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Hourly rate (SGD)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 16 }}>$</span>
                  <input type="number" min="1" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} placeholder="80" />
                </div>
                {errors.hourlyRate && <p style={ERR_STYLE}>{errors.hourlyRate}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>Locations served</label>
                <MultiSelect options={LOCATIONS} selected={locations} onChange={setLocations} />
                {errors.locations && <p style={ERR_STYLE}>{errors.locations}</p>}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={LABEL_STYLE}>
                  Bio{' '}
                  <span style={{ color: 'rgba(238,242,238,0.35)', fontWeight: 400 }}>({bio.length}/300)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 300))}
                  rows={4}
                  placeholder="Tell potential clients about your training style, background, and what makes you unique…"
                  style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
                />
                {errors.bio && <p style={ERR_STYLE}>{errors.bio}</p>}
              </div>
            </>
          )}

          {/* Step 4 (E) — Certifications */}
          {step === 4 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Your certifications</h2>
              <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Add each certification with its name and supporting document.
              </p>
              {certEntries.map((entry, i) => (
                <div key={i} style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ ...LABEL_STYLE, margin: 0 }}>Certification {i + 1}</label>
                    {certEntries.length > 1 && (
                      <button type="button" onClick={() => removeCertEntry(i)} style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.35)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    value={entry.name}
                    onChange={e => updateCertEntry(i, 'name', e.target.value)}
                    placeholder="e.g. NASM-CPT, ACE, ACSM"
                    style={{ ...INPUT_STYLE, marginBottom: 10 }}
                  />
                  <FileUpload
                    label="Document (PDF or image)"
                    files={entry.file ? [entry.file] : []}
                    onChange={files => updateCertEntry(i, 'file', files[0] || null)}
                    maxFiles={1}
                  />
                </div>
              ))}
              {errors.certEntries && <p style={ERR_STYLE}>{errors.certEntries}</p>}
              <button type="button" onClick={addCertEntry} style={{ ...BTN_GHOST, fontSize: 13, padding: '8px 16px', marginTop: 4 }}>
                + Add another certification
              </button>
            </>
          )}

          {/* Step 5 (F) — Compliance */}
          {step === 5 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Verification documents</h2>
              <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                These are reviewed by our team and never shared publicly.
              </p>
              <FileUpload label="Government-issued ID (NRIC / Passport)" files={govIdFiles} onChange={setGovIdFiles} maxFiles={2} required />
              {errors.govId && <p style={ERR_STYLE}>{errors.govId}</p>}
              <FileUpload label="CPR / First Aid certificate" files={cprFiles} onChange={setCprFiles} maxFiles={2} required />
              {errors.cpr && <p style={ERR_STYLE}>{errors.cpr}</p>}
              <FileUpload label="Professional liability insurance (optional but recommended)" files={insuranceFiles} onChange={setInsuranceFiles} maxFiles={2} />
              {serverError && (
                <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 12, marginBottom: 0, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                  {serverError}
                </p>
              )}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            {step > 1 && (
              <button type="button" onClick={() => { setStep(s => s - 1); setErrors({}) }} style={BTN_GHOST}>Back</button>
            )}
            <div style={{ flex: 1 }} />
            {step < 5
              ? <button type="button" onClick={handleNext} style={ctaStyle}>{ctaLabel}</button>
              : <button type="button" onClick={handleSubmit} disabled={submitting} style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
            }
          </div>
        </div>

        {/* Live preview panel — Phase 1 only, after name entered on mobile */}
        {showPreview && (
          <div style={{ flex: 1, maxWidth: 380, position: isMobile ? 'static' : 'sticky', top: 40 }}>
            <TrainerProfilePreview profile={previewProfile} />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the page renders**

Run `npm run dev`, navigate to `/profile/setup` as a logged-in trainer.
Confirm:
- Step 1 of 5 — Identity is shown
- After entering a name, the preview card appears to the right (desktop) or below (mobile)
- Preview updates live as fields are typed
- Advancing through steps works with Back/Continue
- On Step 3 with all fields filled, CTA text changes

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProfileSetupPage.jsx
git commit -m "feat: restructure ProfileSetupPage — two-phase flow with live TrainerProfilePreview"
```

---

### Task 4: ApplicationStatusPage

**Files:**
- Create: `src/pages/ApplicationStatusPage.jsx`
- Create: `src/pages/ApplicationStatusPage.test.jsx`

Fetches `trainer_profiles.status`, `application_ref`, and `rejection_reason` for the current user. Polls every 30 seconds. Shows a 4-dot progress indicator with status-appropriate message and CTA. Redirects to `/dashboard/trainer` when status is `live`.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/ApplicationStatusPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'user-123' } } }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import ApplicationStatusPage from './ApplicationStatusPage'

function mockStatus(status, opts = {}) {
  supabase.from.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            status,
            application_ref: 'RPT-00001',
            rejection_reason: opts.rejection_reason ?? null,
          },
          error: null,
        }),
      }),
    }),
  })
}

function renderPage() {
  return render(<MemoryRouter><ApplicationStatusPage /></MemoryRouter>)
}

describe('ApplicationStatusPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows pending message', async () => {
    mockStatus('pending')
    renderPage()
    expect(await screen.findByText(/Under review/)).toBeInTheDocument()
  })

  it('shows docs_verified message', async () => {
    mockStatus('docs_verified')
    renderPage()
    expect(await screen.findByText(/Documents verified/)).toBeInTheDocument()
  })

  it('shows approved message with availability CTA', async () => {
    mockStatus('approved')
    renderPage()
    expect(await screen.findByText(/Approved/)).toBeInTheDocument()
    expect(screen.getByText(/Set your first available slots/)).toBeInTheDocument()
  })

  it('shows rejection reason when rejected', async () => {
    mockStatus('rejected', { rejection_reason: 'ID document was blurry' })
    renderPage()
    expect(await screen.findByText('ID document was blurry')).toBeInTheDocument()
  })

  it('shows application ref number', async () => {
    mockStatus('pending')
    renderPage()
    expect(await screen.findByText(/RPT-00001/)).toBeInTheDocument()
  })

  it('redirects to dashboard when status is live', async () => {
    mockStatus('live')
    renderPage()
    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/trainer', { replace: true })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/pages/ApplicationStatusPage.test.jsx`
Expected: FAIL with `Cannot find module './ApplicationStatusPage'`

- [ ] **Step 3: Create ApplicationStatusPage**

```jsx
// src/pages/ApplicationStatusPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const STEPS = ['Submitted', 'Docs OK', 'Approved', 'Live']

const STATUS_CONFIG = {
  pending: {
    filledDots: 1,
    message: 'Under review — usually 3–5 business days',
    subtext: 'Our team reviews every application carefully.',
    ctaText: null,
    ctaHref: null,
  },
  docs_verified: {
    filledDots: 2,
    message: 'Documents verified — final approval in progress',
    subtext: 'Almost there. Approval typically follows within 24 hours.',
    ctaText: null,
    ctaHref: null,
  },
  approved: {
    filledDots: 3,
    message: 'Approved! Set your availability to go live',
    subtext: "Your profile is ready. Add your first available slots and you'll appear in client searches.",
    ctaText: 'Set your first available slots to go live →',
    ctaHref: '/dashboard/trainer',
  },
  rejected: {
    filledDots: 0,
    message: 'Application not approved',
    subtext: null,
    ctaText: 'Re-upload documents →',
    ctaHref: '/profile/setup',
  },
}

export default function ApplicationStatusPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [trainerStatus, setTrainerStatus] = useState(null)
  const [applicationRef, setApplicationRef] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchStatus() {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('trainer_profiles')
      .select('status, application_ref, rejection_reason')
      .eq('id', session.user.id)
      .single()
    if (!error && data) {
      setTrainerStatus(data.status)
      setApplicationRef(data.application_ref || '')
      setRejectionReason(data.rejection_reason || '')
      if (data.status === 'live') {
        navigate('/dashboard/trainer', { replace: true })
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  const config = STATUS_CONFIG[trainerStatus] || STATUS_CONFIG.pending
  const isRejected = trainerStatus === 'rejected'
  const dotColor = isRejected ? '#f87171' : '#4ade80'

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
        borderRadius: 12, padding: '40px 36px', height: 'fit-content',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Application status
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#EEF2EE', margin: '0 0 10px', fontWeight: 700, lineHeight: 1.3 }}>
            {config.message}
          </h1>
          {config.subtext && (
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              {config.subtext}
            </p>
          )}
          {isRejected && rejectionReason && (
            <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 6, lineHeight: 1.5 }}>
              {rejectionReason}
            </p>
          )}
        </div>

        {/* 4-dot progress indicator (hidden when rejected) */}
        {!isRejected && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36 }}>
            {STEPS.map((label, i) => {
              const isFilled = i < config.filledDots
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: isFilled ? dotColor : 'rgba(255,255,255,0.12)',
                      border: isFilled ? 'none' : '2px solid rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 10,
                      color: isFilled ? 'rgba(238,242,238,0.7)' : 'rgba(238,242,238,0.25)',
                      letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, margin: '0 4px', marginBottom: 22,
                      background: i < config.filledDots - 1 ? dotColor : 'rgba(255,255,255,0.1)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {config.ctaText && (
          <a
            href={config.ctaHref}
            style={{
              display: 'block', textAlign: 'center',
              background: trainerStatus === 'approved' ? '#4ade80' : 'rgba(255,255,255,0.06)',
              color: trainerStatus === 'approved' ? '#0d1a0e' : '#EEF2EE',
              borderRadius: 6, padding: '14px 24px',
              fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {config.ctaText}
          </a>
        )}

        {/* Reference number */}
        {applicationRef && (
          <p style={{ color: 'rgba(238,242,238,0.25)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 32, textAlign: 'center' }}>
            Ref {applicationRef}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/pages/ApplicationStatusPage.test.jsx`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/ApplicationStatusPage.jsx src/pages/ApplicationStatusPage.test.jsx
git commit -m "feat: add ApplicationStatusPage with 4-state progress tracker"
```

---

### Task 5: Wire up route and availability gate

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/TrainerDashboardPage.jsx`

#### Part A — Add route in App.jsx

- [ ] **Step 1: Add import to App.jsx**

In `src/App.jsx`, add after the existing page imports (around line 18):
```jsx
import ApplicationStatusPage from './pages/ApplicationStatusPage.jsx'
```

- [ ] **Step 2: Add route in the Routes block**

In `src/App.jsx`, in the `<Routes>` block after the `/profile/setup` route (around line 1641):
```jsx
<Route path="/trainer/application-status" element={
  <ProtectedRoute requiredRole="trainer"><ApplicationStatusPage /></ProtectedRoute>
} />
```

- [ ] **Step 3: Verify the route renders**

Run `npm run dev`, navigate to `/trainer/application-status` as a logged-in trainer. Confirm the page loads and shows their current application status.

#### Part B — Availability gate in TrainerDashboardPage

- [ ] **Step 4: Find the availability save handler**

Run:
```bash
grep -n "availability\|saveAvail\|handleSave\|upsert\|insert" src/pages/TrainerDashboardPage.jsx | head -30
```

Identify the async function that persists availability slots to Supabase. It will contain a `supabase.from('...')` call with an `upsert` or `insert` for time slots.

- [ ] **Step 5: Add set_trainer_live call after successful availability save**

In the availability save function (found in Step 4), after the existing successful save block, add:

```jsx
// Transition approved trainer to live when first availability slot is saved
const { data: trainerProfile } = await supabase
  .from('trainer_profiles')
  .select('status')
  .eq('id', session.user.id)
  .single()

if (trainerProfile?.status === 'approved') {
  await supabase.rpc('set_trainer_live')
}
```

Place this after the save succeeds (i.e., after confirming there is no error from the availability save), before any success toast or state reset.

- [ ] **Step 6: Verify the full go-live flow end-to-end**

1. In Supabase SQL editor, set a test trainer's status to `approved`:
   ```sql
   update trainer_profiles set status = 'approved' where id = '<trainer-user-id>';
   ```
2. Log in as that trainer, navigate to `/trainer/application-status`
3. Confirm "Approved! Set your availability to go live" message and green CTA appear
4. Click CTA → lands on `/dashboard/trainer`
5. Save at least one availability slot
6. Confirm in Supabase:
   ```sql
   select status, live_at from trainer_profiles where id = '<trainer-user-id>';
   ```
   Expected: `status = 'live'`, `live_at` is a recent timestamp
7. Navigate back to `/trainer/application-status` — should immediately redirect to `/dashboard/trainer`

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/pages/TrainerDashboardPage.jsx
git commit -m "feat: add application-status route and availability gate for trainer go-live"
```

---

### Task 6: Full test suite pass

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass. The existing component tests (MultiSelect, FileUpload, ProtectedRoute, etc.) should be unaffected. ProfileSetupPage has no pre-existing test file, so no regressions expected there.

- [ ] **Step 2: Fix any failures**

If any test fails, read the error output carefully. Common causes:
- Mock shape mismatch (e.g., `supabase.from` mock missing a chained method)
- Missing `MemoryRouter` wrapper on a page component test

Fix and re-run until all pass.

- [ ] **Step 3: Commit if fixes were needed**

```bash
git add .
git commit -m "fix: resolve test suite regressions after trainer acquisition feature"
```

---

> **Note — Status-change email triggers:** The spec calls for transactional emails when status changes from `pending → docs_verified`, `docs_verified → approved`, and `any → rejected`. Since admin review is via the Supabase dashboard (no admin UI built yet), these emails require a database webhook or Supabase trigger calling the `notify-trainer` Edge Function. This is not included in this plan because it requires Supabase Database Webhooks (Pro feature) or the `pg_net` extension. Implement after the admin review UI is built.
