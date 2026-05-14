# Auth & Signup Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp the auth entry experience to prioritise signup over login, add a full client registration flow (3 steps), redesign the login page with role-aware tabs, and make nav CTAs context-sensitive.

**Architecture:** Three new page components (`SignupEntryPage`, `ClientSignupPage`, `ClientProfileSetupPage`) plus a redesigned `LoginPage`. Nav in `App.jsx` gets context-aware CTAs. A new `client_profiles` Supabase table stores fitness preferences. Post-signup, localStorage keys pre-apply goal/region filters on the browse page.

**Tech Stack:** React 19, React Router v6, Supabase JS v2, Vitest + React Testing Library, inline styles only (no Tailwind)

---

## File Map

| File | Action |
|---|---|
| `supabase/migrations/003_client_profiles.sql` | Create — new table |
| `src/pages/SignupEntryPage.jsx` | Create — `/signup` role picker |
| `src/pages/ClientSignupPage.jsx` | Create — `/signup/client` Step 1 |
| `src/pages/ClientProfileSetupPage.jsx` | Create — `/signup/client/profile` Steps 2–3 |
| `src/pages/LoginPage.jsx` | Modify — role toggle + query param pre-selection |
| `src/App.jsx` | Modify — new routes, nav CTA changes, FeaturedTrainers localStorage init |
| `src/pages/SignupEntryPage.test.jsx` | Create — tests |
| `src/pages/ClientSignupPage.test.jsx` | Create — tests |
| `src/pages/ClientProfileSetupPage.test.jsx` | Create — tests |
| `src/pages/LoginPage.test.jsx` | Create — tests |

---

## Task 1: Database migration — `client_profiles` table

**Files:**
- Create: `supabase/migrations/003_client_profiles.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/003_client_profiles.sql

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

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Open the Supabase dashboard → SQL Editor → New query → paste the migration → Run.

Expected: "Success. No rows returned"

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_client_profiles.sql
git commit -m "feat: add client_profiles migration"
```

---

## Task 2: `SignupEntryPage` — `/signup` role picker

**Files:**
- Create: `src/pages/SignupEntryPage.jsx`
- Create: `src/pages/SignupEntryPage.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/SignupEntryPage.test.jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import SignupEntryPage from './SignupEntryPage'

function renderPage() {
  return render(<MemoryRouter><SignupEntryPage /></MemoryRouter>)
}

describe('SignupEntryPage', () => {
  it('renders client card with correct link', () => {
    renderPage()
    expect(screen.getByText("I'm looking for a trainer")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/signup/client')
  })

  it('renders trainer card with correct link', () => {
    renderPage()
    expect(screen.getByText("I'm a trainer")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apply as trainer/i })).toHaveAttribute('href', '/signup/trainer')
  })

  it('renders log in link', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/calvintee/FitnessGuru && npx vitest run src/pages/SignupEntryPage.test.jsx
```

Expected: FAIL — "Cannot find module './SignupEntryPage'"

- [ ] **Step 3: Create the page**

```jsx
// src/pages/SignupEntryPage.jsx
const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', display: 'flex',
  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '40px 24px',
}

const CARD_STYLE = (accent) => ({
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}33`,
  borderRadius: 16, padding: '40px 36px', flex: 1, maxWidth: 380,
  display: 'flex', flexDirection: 'column', gap: 16,
  transition: 'border-color 0.2s',
})

const CTA_BTN = (bg, color) => ({
  display: 'block', textAlign: 'center', textDecoration: 'none',
  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '14px 24px', cursor: 'pointer', marginTop: 'auto',
})

export default function SignupEntryPage() {
  return (
    <div style={PAGE_STYLE}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 12px' }}>
          FitnessGuru
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(28px, 4vw, 48px)', color: '#EEF2EE', margin: 0, lineHeight: 1 }}>
          Get started
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 780, flexWrap: 'wrap' }}>
        {/* Client card */}
        <div style={CARD_STYLE('#4ade80')}>
          <div style={{ fontSize: 36 }}>🏃</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#EEF2EE', margin: 0 }}>
            I'm looking for a trainer
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.6)', margin: 0, lineHeight: 1.6 }}>
            Create a free account and find your perfect match.
          </p>
          <a href="/signup/client" style={CTA_BTN('#4ade80', '#0d1a0e')}>
            Get started
          </a>
        </div>

        {/* Trainer card */}
        <div style={CARD_STYLE('#fbbf24')}>
          <div style={{ fontSize: 36 }}>💪</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#EEF2EE', margin: 0 }}>
            I'm a trainer
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.6)', margin: 0, lineHeight: 1.6 }}>
            List your profile and grow your client base.
          </p>
          <a href="/signup/trainer" style={CTA_BTN('#fbbf24', '#100e06')}>
            Apply as trainer
          </a>
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.4)', marginTop: 32 }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Log in</a>
      </p>

      <style>{`
        @media (max-width: 600px) {
          div[style*="maxWidth: 780"] { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pages/SignupEntryPage.test.jsx
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/SignupEntryPage.jsx src/pages/SignupEntryPage.test.jsx
git commit -m "feat: add SignupEntryPage role picker at /signup"
```

---

## Task 3: `ClientSignupPage` — account creation (Step 1 of 3)

**Files:**
- Create: `src/pages/ClientSignupPage.jsx`
- Create: `src/pages/ClientSignupPage.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/ClientSignupPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ClientSignupPage from './ClientSignupPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))
import { supabase } from '../lib/supabase'

function renderPage() {
  return render(<MemoryRouter><ClientSignupPage /></MemoryRouter>)
}

describe('ClientSignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Step 1 of 3 progress indicator', () => {
    renderPage()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('renders email, password, and confirm password fields', () => {
    renderPage()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Different1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    })
  })

  it('calls supabase.auth.signUp and navigates on success', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password1!',
        options: { emailRedirectTo: expect.stringContaining('/signup/client/profile') },
      })
      expect(mockNavigate).toHaveBeenCalledWith('/signup/client/profile')
    })
  })

  it('shows server error on signUp failure', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: { message: 'User already registered' } })
    renderPage()
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password1!' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })
  })

  it('renders log in link pointing to /login?role=client', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /log in/i })
    expect(link).toHaveAttribute('href', '/login?role=client')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/ClientSignupPage.test.jsx
```

Expected: FAIL — "Cannot find module './ClientSignupPage'"

- [ ] **Step 3: Create the page**

```jsx
// src/pages/ClientSignupPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateEmail, validatePassword } from '../utils/validation'

const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
}
const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
  borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420,
}
const LABEL_STYLE = {
  display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 14, fontWeight: 500, marginBottom: 6,
}
const INPUT_STYLE = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)',
  borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 15, outline: 'none', boxSizing: 'border-box',
}
const BTN_STYLE = {
  width: '100%', background: '#4ade80', color: '#0d1a0e', border: 'none',
  borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-body)', marginTop: 8,
}
const ERR_STYLE = { color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }

export default function ClientSignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    if (emailErr) errs.email = emailErr
    if (passErr) errs.password = passErr
    if (!passErr && password !== confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/signup/client/profile` },
    })
    setLoading(false)

    if (error) { setServerError(error.message); return }
    navigate('/signup/client/profile')
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Step 1 of 3
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, color: '#EEF2EE', margin: '0 0 8px', fontWeight: 700, letterSpacing: 1 }}>
          Create your account
        </h1>
        <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 15, margin: '0 0 28px' }}>
          Free to join. No contracts.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={LABEL_STYLE}>Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.email ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="email" />
            {errors.email && <p style={ERR_STYLE}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={LABEL_STYLE}>Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.password ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="new-password" />
            {errors.password && <p style={ERR_STYLE}>{errors.password}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="confirm" style={LABEL_STYLE}>Confirm password</label>
            <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.confirm ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="new-password" />
            {errors.confirm && <p style={ERR_STYLE}>{errors.confirm}</p>}
          </div>

          {serverError && (
            <p style={{ ...ERR_STYLE, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
              {serverError}
            </p>
          )}

          <button type="submit" style={{ ...BTN_STYLE, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          Already have an account?{' '}
          <a href="/login?role=client" style={{ color: '#4ade80', textDecoration: 'none' }}>Log in</a>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pages/ClientSignupPage.test.jsx
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClientSignupPage.jsx src/pages/ClientSignupPage.test.jsx
git commit -m "feat: add ClientSignupPage at /signup/client"
```

---

## Task 4: `ClientProfileSetupPage` — Steps 2–3

**Files:**
- Create: `src/pages/ClientProfileSetupPage.jsx`
- Create: `src/pages/ClientProfileSetupPage.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/ClientProfileSetupPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ClientProfileSetupPage from './ClientProfileSetupPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ session: { user: { id: 'user-123' } } })),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({ error: null })),
      insert: vi.fn(() => ({ error: null })),
    })),
  },
}))
import { supabase } from '../lib/supabase'

function renderPage() {
  return render(<MemoryRouter><ClientProfileSetupPage /></MemoryRouter>)
}

describe('ClientProfileSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders Step 2 of 3 on mount', () => {
    renderPage()
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  it('shows error when full name is empty on Step 2', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })

  it('advances to Step 3 when full name is provided', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
    })
  })

  it('shows goal chips and region pills on Step 3', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => {
      expect(screen.getByText('Lose weight')).toBeInTheDocument()
      expect(screen.getByText('Central')).toBeInTheDocument()
    })
  })

  it('shows error on Step 3 when goal or region not selected', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Step 3 of 3'))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    await waitFor(() => {
      expect(screen.getByText(/please select a goal and region/i)).toBeInTheDocument()
    })
  })

  it('saves to supabase, sets localStorage, and navigates to / on completion', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const insertMock = vi.fn().mockResolvedValue({ error: null })
    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') return { upsert: upsertMock }
      if (table === 'client_profiles') return { upsert: insertMock }
      return {}
    })

    renderPage()
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Step 3 of 3'))

    fireEvent.click(screen.getByText('Lose weight'))
    fireEvent.click(screen.getByText('East'))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    await waitFor(() => {
      expect(localStorage.getItem('fg_goal')).toBe('Lose weight')
      expect(localStorage.getItem('fg_region')).toBe('East')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/ClientProfileSetupPage.test.jsx
```

Expected: FAIL — "Cannot find module './ClientProfileSetupPage'"

- [ ] **Step 3: Create the page**

```jsx
// src/pages/ClientProfileSetupPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const GOALS = ['Lose weight', 'Build muscle', 'Train through pregnancy', 'Improve sports performance', 'Just start somewhere']
const REGIONS = ['Central', 'East', 'West', 'North', 'North-East']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
}
const CARD_STYLE = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)',
  borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 480,
}
const LABEL_STYLE = {
  display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 14, fontWeight: 500, marginBottom: 6,
}
const INPUT_STYLE = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)',
  borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 15, outline: 'none', boxSizing: 'border-box',
}
const ERR_STYLE = { color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }

function pill(active) {
  return {
    fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer', borderRadius: 999,
    padding: '8px 16px', border: `1px solid ${active ? 'rgba(74,222,128,0.55)' : 'rgba(238,242,238,0.2)'}`,
    background: active ? 'rgba(74,222,128,0.12)' : 'transparent',
    color: active ? '#4ade80' : 'rgba(238,242,238,0.7)',
    transition: 'all 0.15s',
  }
}

export default function ClientProfileSetupPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [step, setStep] = useState(2)

  // Step 2 fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 3 fields
  const [goal, setGoal] = useState(null)
  const [region, setRegion] = useState(null)
  const [level, setLevel] = useState(null)

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function handleStep2Next(e) {
    e.preventDefault()
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required.'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(3)
  }

  async function handleStep3Submit(e) {
    e.preventDefault()
    if (!goal || !region) {
      setErrors({ fitness: 'Please select a goal and region.' })
      return
    }
    if (!session?.user?.id) return

    setSubmitting(true)
    setServerError('')

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: session.user.id,
      role: 'client',
      full_name: fullName,
      ...(phone ? { phone } : {}),
    })

    if (profileError) { setServerError(profileError.message); setSubmitting(false); return }

    const { error: cpError } = await supabase.from('client_profiles').upsert({
      id: session.user.id,
      fitness_goal: goal,
      preferred_region: region,
      ...(level ? { fitness_level: level.toLowerCase() } : {}),
    })

    setSubmitting(false)
    if (cpError) { setServerError(cpError.message); return }

    localStorage.setItem('fg_goal', goal)
    localStorage.setItem('fg_region', region)
    navigate('/')
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Step {step} of 3
        </p>

        {step === 2 && (
          <>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', margin: '0 0 8px', fontWeight: 700 }}>
              About you
            </h1>
            <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 15, margin: '0 0 28px' }}>
              How should trainers address you?
            </p>
            <form onSubmit={handleStep2Next} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="fullName" style={LABEL_STYLE}>Full name</label>
                <input id="fullName" type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  style={{ ...INPUT_STYLE, borderColor: errors.fullName ? '#f87171' : 'rgba(238,242,238,0.2)' }}
                  autoComplete="name" />
                {errors.fullName && <p style={ERR_STYLE}>{errors.fullName}</p>}
              </div>
              <div style={{ marginBottom: 28 }}>
                <label htmlFor="phone" style={LABEL_STYLE}>Phone <span style={{ color: 'rgba(238,242,238,0.4)', fontWeight: 400 }}>(optional)</span></label>
                <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  style={INPUT_STYLE} autoComplete="tel" />
              </div>
              <button type="submit" style={{ width: '100%', background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Next
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', margin: '0 0 8px', fontWeight: 700 }}>
              Your fitness
            </h1>
            <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 15, margin: '0 0 28px' }}>
              This helps us match you to the right trainers.
            </p>
            <form onSubmit={handleStep3Submit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <p style={{ ...LABEL_STYLE, marginBottom: 10 }}>What's your goal?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GOALS.map(g => (
                    <button key={g} type="button" onClick={() => setGoal(g)} style={pill(goal === g)}>{g}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ ...LABEL_STYLE, marginBottom: 10 }}>Where do you train?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {REGIONS.map(r => (
                    <button key={r} type="button" onClick={() => setRegion(r)} style={pill(region === r)}>{r}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <p style={{ ...LABEL_STYLE, marginBottom: 10 }}>
                  Fitness level <span style={{ color: 'rgba(238,242,238,0.4)', fontWeight: 400, textTransform: 'none', fontSize: 13 }}>(optional)</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {LEVELS.map(l => (
                    <button key={l} type="button" onClick={() => setLevel(level === l ? null : l)} style={pill(level === l)}>{l}</button>
                  ))}
                </div>
              </div>

              {errors.fitness && <p style={{ ...ERR_STYLE, marginBottom: 12 }}>{errors.fitness}</p>}
              {serverError && (
                <p style={{ ...ERR_STYLE, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                  {serverError}
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', fontFamily: 'var(--font-body)', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Saving…' : 'Finish'}
                </button>
                <button type="button" onClick={() => { localStorage.setItem('fg_goal', goal ?? ''); localStorage.setItem('fg_region', region ?? ''); navigate('/') }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer', padding: '0 8px' }}>
                  Skip for now
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pages/ClientProfileSetupPage.test.jsx
```

Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClientProfileSetupPage.jsx src/pages/ClientProfileSetupPage.test.jsx
git commit -m "feat: add ClientProfileSetupPage at /signup/client/profile"
```

---

## Task 5: Redesign `LoginPage` — role toggle + query param

**Files:**
- Modify: `src/pages/LoginPage.jsx`
- Create: `src/pages/LoginPage.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/LoginPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginPage from './LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn() })) })) })),
  },
}))
import { supabase } from '../lib/supabase'

function renderWithRole(role = '') {
  const path = role ? `/login?role=${role}` : '/login'
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('defaults to client tab when no role param', () => {
    renderWithRole()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create one free/i })).toHaveAttribute('href', '/signup/client')
  })

  it('activates trainer tab when ?role=trainer', () => {
    renderWithRole('trainer')
    expect(screen.getByText('Trainer sign in')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /apply as a trainer/i })).toHaveAttribute('href', '/signup/trainer')
  })

  it('switches tab on click', () => {
    renderWithRole()
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /trainer/i }))
    expect(screen.getByText('Trainer sign in')).toBeInTheDocument()
  })

  it('redirects to /dashboard/trainer after trainer login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'uid' } }, error: null })
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'trainer' } }) }) }),
    })
    renderWithRole('trainer')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'trainer@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/trainer')
    })
  })

  it('redirects to / after client login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'uid' } }, error: null })
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role: 'client' } }) }) }),
    })
    renderWithRole('client')
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'client@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/pages/LoginPage.test.jsx
```

Expected: FAIL — tests about "Welcome back" / "Trainer sign in" / tabs won't find those elements in current LoginPage

- [ ] **Step 3: Replace `LoginPage.jsx` with role-toggle version**

```jsx
// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { validateEmail, validatePassword } from '../utils/validation'

const LABEL_STYLE = {
  display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 14, fontWeight: 500, marginBottom: 6,
}
const INPUT_STYLE = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)',
  borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)',
  fontSize: 15, outline: 'none', boxSizing: 'border-box',
}
const ERR_STYLE = { color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('role') === 'trainer' ? 'trainer' : 'client'
  const [tab, setTab] = useState(initialTab)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const isTrainer = tab === 'trainer'
  const accent = isTrainer ? '#fbbf24' : '#4ade80'
  const bg = isTrainer ? '#100e06' : '#0d1a0e'

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    if (emailErr) errs.email = emailErr
    if (passErr) errs.password = passErr
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) { setServerError(error.message); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') navigate('/admin')
    else if (profile?.role === 'trainer') navigate('/dashboard/trainer')
    else navigate('/')
  }

  const tabBtn = (active, color) => ({
    flex: 1, background: active ? `${color}18` : 'transparent',
    color: active ? color : 'rgba(238,242,238,0.4)',
    border: `1px solid ${active ? `${color}55` : 'rgba(238,242,238,0.12)'}`,
    borderRadius: 6, padding: '9px 0', fontSize: 14, fontWeight: active ? 700 : 400,
    fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', transition: 'background 0.3s' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 420 }}>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          <button onClick={() => setTab('client')} style={tabBtn(!isTrainer, '#4ade80')}>
            Client
          </button>
          <button onClick={() => setTab('trainer')} style={tabBtn(isTrainer, '#fbbf24')}>
            Trainer
          </button>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, color: '#EEF2EE', margin: '0 0 8px', fontWeight: 700, letterSpacing: 1 }}>
          {isTrainer ? 'Trainer sign in' : 'Welcome back'}
        </h1>
        <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: '0 0 28px' }}>
          {isTrainer
            ? <>Not listed yet? <a href="/signup/trainer" style={{ color: '#fbbf24', textDecoration: 'none' }}>Apply as a trainer</a></>
            : <>Don't have an account? <a href="/signup/client" style={{ color: '#4ade80', textDecoration: 'none' }}>Create one free</a></>
          }
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={LABEL_STYLE}>Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.email ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="email" />
            {errors.email && <p style={ERR_STYLE}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="password" style={LABEL_STYLE}>Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.password ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="current-password" />
            {errors.password && <p style={ERR_STYLE}>{errors.password}</p>}
          </div>

          {serverError && (
            <p style={{ ...ERR_STYLE, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
              {serverError}
            </p>
          )}

          <button type="submit"
            style={{ width: '100%', background: accent, color: isTrainer ? '#100e06' : '#0d1a0e', border: 'none', borderRadius: 6, padding: '12px 0', fontSize: 16, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: 'var(--font-body)', marginTop: 8, opacity: loading ? 0.6 : 1, transition: 'background 0.3s' }}
            disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/pages/LoginPage.test.jsx
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/LoginPage.jsx src/pages/LoginPage.test.jsx
git commit -m "feat: redesign LoginPage with client/trainer role toggle"
```

---

## Task 6: Wire up new routes + nav CTAs in `App.jsx`

**Files:**
- Modify: `src/App.jsx`

This task uses Python string replacement via Bash since `App.jsx` is too large for the Edit tool.

- [ ] **Step 1: Add imports for new pages**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = \"import LoginPage from './pages/LoginPage.jsx'\"
new = \"\"\"import LoginPage from './pages/LoginPage.jsx'
import SignupEntryPage from './pages/SignupEntryPage.jsx'
import ClientSignupPage from './pages/ClientSignupPage.jsx'
import ClientProfileSetupPage from './pages/ClientProfileSetupPage.jsx'\"\"\"
assert old in content, 'import pattern not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 2: Add new routes and redirect `/register/trainer`**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = \"      <Route path=\\\"/register/trainer\\\" element={<RegisterTrainerPage />} />\"
new = \"\"\"      <Route path=\"/register/trainer\" element={<Navigate to=\"/signup/trainer\" replace />} />
      <Route path=\"/signup\" element={<SignupEntryPage />} />
      <Route path=\"/signup/client\" element={<ClientSignupPage />} />
      <Route path=\"/signup/client/profile\" element={
        <ProtectedRoute><ClientProfileSetupPage /></ProtectedRoute>
      } />
      <Route path=\"/signup/trainer\" element={<RegisterTrainerPage />} />\"\"\"
assert old in content, 'route pattern not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 3: Add `Navigate` to the react-router-dom import**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = \"import { Routes, Route, useNavigate } from 'react-router-dom'\"
new = \"import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'\"
assert old in content, 'import not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 4: Update `TrainerPage` onApply prop to use `/signup/trainer`**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = \"{role === 'trainer' && <TrainerPage onApply={() => navigate('/register/trainer')} />}\"
new = \"{role === 'trainer' && <TrainerPage onApply={() => navigate('/signup/trainer')} />}\"
assert old in content, 'TrainerPage onApply not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 5: Update desktop nav CTA — change href + text based on role**

Replace the static `href="#waitlist"` CTA anchor in the desktop nav with role-aware links:

```bash
python3 -c "
content = open('src/App.jsx').read()
old = '''          <a href=\"#waitlist\" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            color: isTrainer ? '#141008' : '#fff', textDecoration: 'none',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            background: accent, padding: '10px 22px', borderRadius: 8,
            transition: 'opacity 0.2s, transform 0.15s', display: 'inline-block',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {isTrainer ? 'Apply as Trainer' : 'Join Waitlist'}
          </a>'''
new = '''          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            background: accent, padding: '10px 22px', borderRadius: 8,
            transition: 'opacity 0.2s, transform 0.15s', display: 'inline-block',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>'''
assert old in content, 'desktop CTA not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 6: Update desktop nav Log in link to pass `?role=` param**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = '''          <a href=\"/login\" style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}>
            Log in
          </a>'''
new = '''          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}>
            Log in
          </a>'''
assert old in content, 'desktop Log in link not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 7: Update mobile drawer CTA and Log in link**

```bash
python3 -c "
content = open('src/App.jsx').read()
old = '''          <a href=\"/login\" onClick={() => setOpen(false)}
            style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Log in
          </a>
          <a href=\"#waitlist\" onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: isTrainer ? '#141008' : '#fff', textDecoration: 'none', background: accent, padding: '14px', borderRadius: 8 }}>
            {isTrainer ? 'Apply as Trainer' : 'Join Waitlist'}
          </a>'''
new = '''          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} onClick={() => setOpen(false)}
            style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Log in
          </a>
          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none', background: accent, padding: '14px', borderRadius: 8 }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>'''
assert old in content, 'mobile drawer not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 8: Hide nav Log in + CTA on SplitHero (role === null)**

The spec requires no primary CTA when no role is selected. The "Log in" and CTA links are currently outside the `{role && ...}` block — wrap them so they only render when a role is active:

```bash
python3 -c "
content = open('src/App.jsx').read()
old = '''          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}>
            Log in
          </a>
          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            background: accent, padding: '10px 22px', borderRadius: 8,
            transition: 'opacity 0.2s, transform 0.15s', display: 'inline-block',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>'''
new = '''{role && (
            <>
          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} style={{
            fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
            color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}>
            Log in
          </a>
          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
            color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none',
            letterSpacing: '0.05em', textTransform: 'uppercase',
            background: accent, padding: '10px 22px', borderRadius: 8,
            transition: 'opacity 0.2s, transform 0.15s', display: 'inline-block',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>
            </>
          )}'''
assert old in content, 'desktop CTA block not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

Do the same for the mobile drawer — wrap the Log in + CTA links in `{role && (...)}`:

```bash
python3 -c "
content = open('src/App.jsx').read()
old = '''          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} onClick={() => setOpen(false)}
            style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Log in
          </a>
          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none', background: accent, padding: '14px', borderRadius: 8 }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>'''
new = '''{role && (
            <>
          <a href={isTrainer ? '/login?role=trainer' : '/login?role=client'} onClick={() => setOpen(false)}
            style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            Log in
          </a>
          <a href={isTrainer ? '/signup/trainer' : '/signup/client'} onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: isTrainer ? '#141008' : '#0d1a0e', textDecoration: 'none', background: accent, padding: '14px', borderRadius: 8 }}>
            {isTrainer ? 'Apply as Trainer' : 'Create Account'}
          </a>
            </>
          )}'''
assert old in content, 'mobile drawer CTA block not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 9: Verify the app compiles with no errors**

```bash
npx vite build 2>&1 | tail -20
```

Expected: build succeeds with no errors. If errors appear, check the Python replacements ran cleanly.

- [ ] **Step 10: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire up new auth routes and context-aware nav CTAs"
```

---

## Task 7: Pre-apply filters from localStorage in `FeaturedTrainers`

After a client completes signup, `fg_goal` and `fg_region` are in localStorage. `FeaturedTrainers` should read and apply them on mount, then clear the keys.

**Files:**
- Modify: `src/App.jsx` (FeaturedTrainers component, around the `useState` declarations)

- [ ] **Step 1: Update `activeGoal` and `activeRegion` initial state to read from localStorage**

Find the `FeaturedTrainers` function in `App.jsx` and update the two `useState` calls:

```bash
python3 -c "
content = open('src/App.jsx').read()
old = \"  const [activeGoal, setActiveGoal] = useState(null)
  const [activeRegion, setActiveRegion] = useState(null)\"
new = \"\"\"  const [activeGoal, setActiveGoal] = useState(() => {
    const v = localStorage.getItem('fg_goal')
    if (v) { localStorage.removeItem('fg_goal'); return v }
    return null
  })
  const [activeRegion, setActiveRegion] = useState(() => {
    const v = localStorage.getItem('fg_region')
    if (v) { localStorage.removeItem('fg_region'); return v }
    return null
  })\"\"\"
assert old in content, 'FeaturedTrainers useState not found'
open('src/App.jsx', 'w').write(content.replace(old, new, 1))
print('done')
"
```

- [ ] **Step 2: Verify the app still compiles**

```bash
npx vite build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: pre-apply goal/region filters from localStorage after client signup"
```

---

## Task 8: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test `/signup` role picker**

Navigate to `http://localhost:5173/signup`. Verify:
- Two cards side by side — client (green) and trainer (amber)
- "Get started" → `/signup/client`
- "Apply as trainer" → `/signup/trainer`
- "Log in" → `/login`

- [ ] **Step 3: Test client signup flow (Steps 1–3)**

Navigate to `/signup/client`:
- Fill email + password + confirm → click "Create account"
- Should advance to `/signup/client/profile` at Step 2
- Enter full name → click Next
- Should show Step 3 with goal chips + region pills
- Select "Lose weight" + "East" → click Finish
- Should navigate to `/` with client page showing, "Lose weight" and "East" pills pre-highlighted

- [ ] **Step 4: Test login role toggle**

Navigate to `/login`:
- Default tab should be "Client" / "Welcome back" (green)
- Click "Trainer" tab → heading changes to "Trainer sign in" (amber tint)
- Navigate to `/login?role=trainer` → trainer tab pre-selected on load

- [ ] **Step 5: Test nav CTAs on client page**

On the client landing page:
- Primary CTA in nav: "Create Account" (green) → `/signup/client`
- "Log in" → `/login?role=client`

On the trainer page:
- Primary CTA: "Apply as Trainer" (amber) → `/signup/trainer`
- "Log in" → `/login?role=trainer`

- [ ] **Step 6: Test `/register/trainer` redirect**

Navigate to `/register/trainer` — should redirect to `/signup/trainer`.

- [ ] **Step 7: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "test: verify auth revamp smoke tests pass"
```
