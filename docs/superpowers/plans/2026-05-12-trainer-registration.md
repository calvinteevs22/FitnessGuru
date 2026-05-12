# Trainer Registration & Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add functional trainer registration, admin approval workflow, and trainer dashboard to FitnessGuru using Supabase + React Router.

**Architecture:** React/Vite frontend with react-router-dom for page routing. Supabase handles auth, Postgres DB, and file storage. Existing landing page stays at `/`. New pages added as routes. Frontend calls Supabase directly — no separate API server.

**Tech Stack:** React 18, Vite, react-router-dom v6, @supabase/supabase-js v2, Vitest + @testing-library/react, Resend (email via Supabase Edge Function)

---

## File Map

**New files:**
- `src/lib/supabase.js` — Supabase client singleton
- `src/utils/validation.js` — Pure validation functions (email, password, file)
- `src/utils/validation.test.js` — Tests for validation functions
- `src/test-setup.js` — Vitest + jest-dom setup
- `src/hooks/useAuth.jsx` — Auth context provider + hook
- `src/components/ProtectedRoute.jsx` — Route guard
- `src/components/ProtectedRoute.test.jsx` — Tests for ProtectedRoute
- `src/components/FileUpload.jsx` — Reusable file upload widget
- `src/components/FileUpload.test.jsx` — Tests for file validation
- `src/components/MultiSelect.jsx` — Reusable multi-select tag input
- `src/pages/LoginPage.jsx` — `/login`
- `src/pages/RegisterTrainerPage.jsx` — `/register/trainer`
- `src/pages/VerifyPage.jsx` — `/verify`
- `src/pages/ProfileSetupPage.jsx` — `/profile/setup` (5-step form)
- `src/pages/TrainerDashboardPage.jsx` — `/dashboard/trainer`
- `src/pages/AdminPage.jsx` — `/admin`
- `supabase/migrations/001_initial_schema.sql` — Tables + RLS + RPCs
- `supabase/functions/notify-trainer/index.ts` — Email Edge Function
- `.env.local.example` — env var template

**Modified files:**
- `package.json` — add deps
- `vite.config.js` — remove base path, add test config
- `src/main.jsx` — add BrowserRouter + AuthProvider
- `src/App.jsx` — rename App→Landing, add Routes, pass onApply to TrainerPage
- `.github/workflows/deploy.yml` — disable GitHub Pages workflow

---

## Task 1: Install dependencies + configure Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/test-setup.js`
- Create: `.env.local.example`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install react-router-dom @supabase/supabase-js
```

Expected: both packages added to `dependencies` in package.json.

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Update vite.config.js**

Replace the entire file:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
    globals: true,
  },
})
```

Note: `base: '/FitnessGuru/'` is intentionally removed — Vercel serves from root.

- [ ] **Step 4: Add test script to package.json**

In the `scripts` section, add:
```json
"test": "vitest"
```

- [ ] **Step 5: Create src/test-setup.js**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create .env.local.example**

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Copy this file to `.env.local` and fill in your real values. Never commit `.env.local`.

Verify `.gitignore` contains `.env.local` (it should by default with Vite).

- [ ] **Step 7: Verify dev server still starts**

```bash
npm run dev
```

Expected: dev server starts, landing page loads at `http://localhost:5173/` (no base path now).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js src/test-setup.js .env.local.example
git commit -m "feat: add react-router-dom, supabase, vitest dependencies"
```

---

## Task 2: Database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

> **Manual prerequisite:** Create a free Supabase project at https://supabase.com. Copy the Project URL and anon key into your `.env.local` file.

- [ ] **Step 1: Create the SQL migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Helper function to check admin role (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles table (shared base for all user types)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('trainer', 'client', 'admin')),
  full_name text,
  phone text,
  profile_photo_url text,
  bio text,
  created_at timestamptz default now() not null
);

-- Trainer profiles table
create table public.trainer_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  certifications text[] default '{}',
  specialties text[] default '{}',
  years_experience int,
  hourly_rate int,
  session_types text[] default '{}',
  locations_served text[] default '{}',
  documents jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.trainer_profiles enable row level security;

-- profiles policies
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- trainer_profiles policies
create policy "Trainers read own trainer profile"
  on public.trainer_profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Trainers insert own trainer profile"
  on public.trainer_profiles for insert
  with check (auth.uid() = id);

-- Trainers update via RPC only (see below) — direct update blocked
-- Admins can update status fields
create policy "Admins update trainer profile status"
  on public.trainer_profiles for update
  using (public.is_admin());

-- RPC: create trainer profile (called after profile setup form submit)
-- Always sets status = 'pending'. Trainer cannot self-set status.
create or replace function public.submit_trainer_profile(
  p_full_name text,
  p_phone text,
  p_profile_photo_url text,
  p_bio text,
  p_certifications text[],
  p_specialties text[],
  p_years_experience int,
  p_hourly_rate int,
  p_session_types text[],
  p_locations_served text[],
  p_documents jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role, full_name, phone, profile_photo_url, bio)
  values (auth.uid(), 'trainer', p_full_name, p_phone, p_profile_photo_url, p_bio)
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    profile_photo_url = excluded.profile_photo_url,
    bio = excluded.bio;

  insert into public.trainer_profiles (
    id, certifications, specialties, years_experience, hourly_rate,
    session_types, locations_served, documents, status
  )
  values (
    auth.uid(), p_certifications, p_specialties, p_years_experience, p_hourly_rate,
    p_session_types, p_locations_served, p_documents, 'pending'
  )
  on conflict (id) do update set
    certifications = excluded.certifications,
    specialties = excluded.specialties,
    years_experience = excluded.years_experience,
    hourly_rate = excluded.hourly_rate,
    session_types = excluded.session_types,
    locations_served = excluded.locations_served,
    documents = excluded.documents,
    status = 'pending',
    reviewed_at = null,
    admin_notes = null;
end;
$$;
```

- [ ] **Step 2: Run the SQL in Supabase**

1. Go to your Supabase project → SQL Editor
2. Paste the entire contents of `001_initial_schema.sql` and click Run
3. Verify no errors in the output

- [ ] **Step 3: Create storage buckets in Supabase**

Go to Supabase → Storage → New bucket:

**Bucket 1:** `profile-photos`
- Public: No (private)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png`

**Bucket 2:** `documents`
- Public: No (private)
- File size limit: 5MB
- Allowed MIME types: `application/pdf, image/jpeg, image/png`

For each bucket, go to Policies and add:
- INSERT: `auth.uid()::text = (storage.foldername(name))[1]` (users can only upload to their own folder)
- SELECT: `auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()` (users see own files, admins see all)

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema, RLS policies, and storage buckets"
```

---

## Task 3: Supabase client + validation utilities

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/utils/validation.js`
- Create: `src/utils/validation.test.js`

- [ ] **Step 1: Create src/lib/supabase.js**

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- [ ] **Step 2: Create src/utils/validation.js**

```js
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_FILES_PER_TYPE = 5

export function validateFile(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Only PDF, JPG, and PNG files are accepted.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File must be smaller than 5MB.'
  }
  return null
}

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return null
}

export function validatePassword(password) {
  if (!password) return 'Password is required.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  return null
}

export function validateRequired(value, fieldName) {
  const empty = value === null || value === undefined ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)
  return empty ? `${fieldName} is required.` : null
}
```

- [ ] **Step 3: Write failing tests**

Create `src/utils/validation.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  validateFile,
  validateEmail,
  validatePassword,
  validateRequired,
  MAX_FILE_SIZE_BYTES,
} from './validation'

describe('validateFile', () => {
  it('accepts PDF files under 5MB', () => {
    const file = { type: 'application/pdf', size: 1024 * 1024 }
    expect(validateFile(file)).toBeNull()
  })
  it('accepts JPEG files', () => {
    expect(validateFile({ type: 'image/jpeg', size: 100 })).toBeNull()
  })
  it('accepts PNG files', () => {
    expect(validateFile({ type: 'image/png', size: 100 })).toBeNull()
  })
  it('rejects disallowed file types', () => {
    expect(validateFile({ type: 'text/plain', size: 100 })).toMatch(/PDF, JPG, and PNG/)
  })
  it('rejects files over 5MB', () => {
    expect(validateFile({ type: 'image/jpeg', size: MAX_FILE_SIZE_BYTES + 1 })).toMatch(/5MB/)
  })
})

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })
  it('rejects empty email', () => {
    expect(validateEmail('')).toBeTruthy()
  })
  it('rejects email without @', () => {
    expect(validateEmail('notanemail')).toBeTruthy()
  })
})

describe('validatePassword', () => {
  it('accepts 8+ character password', () => {
    expect(validatePassword('securepass')).toBeNull()
  })
  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('short')).toBeTruthy()
  })
  it('rejects empty password', () => {
    expect(validatePassword('')).toBeTruthy()
  })
})

describe('validateRequired', () => {
  it('accepts non-empty string', () => {
    expect(validateRequired('hello', 'Name')).toBeNull()
  })
  it('rejects empty string', () => {
    expect(validateRequired('', 'Name')).toMatch(/Name/)
  })
  it('rejects empty array', () => {
    expect(validateRequired([], 'Specialties')).toMatch(/Specialties/)
  })
  it('accepts non-empty array', () => {
    expect(validateRequired(['yoga'], 'Specialties')).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests to verify they fail (no implementation yet) then pass**

```bash
npm test
```

Expected: all tests PASS (implementation was written in Step 2 before tests in Step 3 — both are in this task).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.js src/utils/validation.js src/utils/validation.test.js
git commit -m "feat: add supabase client and validation utilities"
```

---

## Task 4: Auth hook

**Files:**
- Create: `src/hooks/useAuth.jsx`

- [ ] **Step 1: Create src/hooks/useAuth.jsx**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = still loading
  const [profile, setProfile] = useState(null)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    profile,
    loading: session === undefined,
    role: profile?.role ?? null,
    signOut: () => supabase.auth.signOut(),
    refreshProfile: () => session && fetchProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.jsx
git commit -m "feat: add auth context hook"
```

---

## Task 5: Routing setup + ProtectedRoute

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/components/ProtectedRoute.jsx`
- Create: `src/components/ProtectedRoute.test.jsx`

- [ ] **Step 1: Write failing ProtectedRoute tests**

Create `src/components/ProtectedRoute.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))
import { useAuth } from '../hooks/useAuth'

describe('ProtectedRoute', () => {
  it('shows loading indicator while auth is resolving', () => {
    useAuth.mockReturnValue({ loading: true, session: undefined, profile: null })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>protected</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('redirects to /login when unauthenticated', () => {
    useAuth.mockReturnValue({ loading: false, session: null, profile: null })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute><div>protected</div></ProtectedRoute>} />
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders children when authenticated with matching role', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="trainer"><div>trainer content</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('trainer content')).toBeInTheDocument()
  })

  it('redirects to / when authenticated but wrong role', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><div>admin</div></ProtectedRoute>} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('renders children when authenticated with no role requirement', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: { id: '1' } }, profile: { role: 'trainer' } })
    render(
      <MemoryRouter>
        <ProtectedRoute><div>any authenticated content</div></ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('any authenticated content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test ProtectedRoute
```

Expected: FAIL — `ProtectedRoute` module not found.

- [ ] **Step 3: Create src/components/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Loading...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) return <Navigate to="/" replace />

  return children
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test ProtectedRoute
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Update src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 6: Update src/App.jsx**

Make three changes:

**Change 1 — Add imports at the top of the file** (after the existing React import):

```jsx
import { Routes, Route, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterTrainerPage from './pages/RegisterTrainerPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import ProfileSetupPage from './pages/ProfileSetupPage.jsx'
import TrainerDashboardPage from './pages/TrainerDashboardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
```

**Change 2 — Rename the existing `App` function to `Landing` and add `onApply` prop threading:**

Find the line `export default function App() {` and rename it to `function Landing() {`. Then inside, add `const navigate = useNavigate()` and update the TrainerPage render to pass `onApply`:

```jsx
function Landing() {
  const [role, setRole] = useState(() => localStorage.getItem('fg_role'))
  const [fading, setFading] = useState(false)
  const navigate = useNavigate()

  const selectRole = (newRole) => {
    setFading(true)
    setTimeout(() => {
      localStorage.setItem('fg_role', newRole)
      setRole(newRole)
      window.scrollTo(0, 0)
      setFading(false)
    }, 280)
  }
  const switchRole = () => selectRole(role === 'client' ? 'trainer' : 'client')

  return (
    <>
      <a href="#main-content" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
        onFocus={e => { e.target.style.left = '0'; e.target.style.width = 'auto'; e.target.style.height = 'auto' }}
        onBlur={e => { e.target.style.left = '-9999px'; e.target.style.width = '1px'; e.target.style.height = '1px' }}>
        Skip to main content
      </a>
      <Nav role={role} onSwitch={switchRole} />
      <main id="main-content" style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease-out' }}>
        {role === null && <SplitHero onSelect={selectRole} />}
        {role === 'client' && <ClientPage />}
        {role === 'trainer' && <TrainerPage onApply={() => navigate('/register/trainer')} />}
      </main>
      {role !== null && <Footer />}
    </>
  )
}
```

**Change 3 — Add new `App` function at the bottom of the file** (replacing the old export):

```jsx
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/trainer" element={<RegisterTrainerPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/profile/setup" element={
        <ProtectedRoute><ProfileSetupPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/trainer" element={
        <ProtectedRoute requiredRole="trainer"><TrainerDashboardPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>
      } />
    </Routes>
  )
}
```

- [ ] **Step 7: Create stub pages so imports don't break**

Create `src/pages/LoginPage.jsx`:
```jsx
export default function LoginPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Login — coming soon</div> }
```

Create `src/pages/RegisterTrainerPage.jsx`:
```jsx
export default function RegisterTrainerPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Register Trainer — coming soon</div> }
```

Create `src/pages/VerifyPage.jsx`:
```jsx
export default function VerifyPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Verify — coming soon</div> }
```

Create `src/pages/ProfileSetupPage.jsx`:
```jsx
export default function ProfileSetupPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Profile Setup — coming soon</div> }
```

Create `src/pages/TrainerDashboardPage.jsx`:
```jsx
export default function TrainerDashboardPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Trainer Dashboard — coming soon</div> }
```

Create `src/pages/AdminPage.jsx`:
```jsx
export default function AdminPage() { return <div style={{ color: '#EEF2EE', padding: 40 }}>Admin — coming soon</div> }
```

- [ ] **Step 8: Update TrainerPage in App.jsx to accept onApply prop**

Find the `function TrainerPage()` declaration and add the `onApply` prop. Then find all CTA buttons in TrainerPage that link to `#waitlist` and update the primary "Apply as a Trainer" buttons to call `onApply()` instead.

Specifically, find the TrainerHero section's CTA `<a href="#waitlist"` and the TrainerCTA section's CTA button and change them to:

```jsx
<button
  onClick={onApply}
  style={{
    background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6,
    padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 8,
  }}>
  Apply as a Trainer <ArrowRight size={16} />
</button>
```

The function signature changes from:
```jsx
function TrainerPage() {
```
to:
```jsx
function TrainerPage({ onApply = () => {} }) {
```

- [ ] **Step 9: Verify dev server works and routing works**

```bash
npm run dev
```

Navigate to `http://localhost:5173/login` — should show "Login — coming soon".
Navigate to `http://localhost:5173/` — landing page should work as before.

- [ ] **Step 10: Commit**

```bash
git add src/main.jsx src/App.jsx src/components/ProtectedRoute.jsx src/components/ProtectedRoute.test.jsx src/pages/
git commit -m "feat: add react-router routing, ProtectedRoute, and page stubs"
```

---

## Task 6: Login page

**Files:**
- Modify: `src/pages/LoginPage.jsx`

- [ ] **Step 1: Implement LoginPage**

Replace the stub with the full implementation:

```jsx
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

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) { setServerError(error.message); return }

    // Fetch profile to determine redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') navigate('/admin')
    else if (profile?.role === 'trainer') navigate('/dashboard/trainer')
    else navigate('/')
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, color: '#EEF2EE', margin: '0 0 28px', fontWeight: 700, letterSpacing: 1 }}>
          Sign in
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.email ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="email" />
            {errors.email && <p style={ERR_STYLE}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL_STYLE}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.password ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="current-password" />
            {errors.password && <p style={ERR_STYLE}>{errors.password}</p>}
          </div>

          {serverError && (
            <p style={{ ...ERR_STYLE, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
              {serverError}
            </p>
          )}

          <button type="submit" style={{ ...BTN_STYLE, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>
          Want to join as a trainer?{' '}
          <Link to="/register/trainer" style={{ color: '#4ade80', textDecoration: 'none' }}>Apply here</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Manual test**

```bash
npm run dev
```

Navigate to `http://localhost:5173/login`. Verify:
- Form renders with email + password fields
- Submitting empty fields shows validation errors
- Invalid email format shows error
- (Live Supabase test optional at this stage)

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.jsx
git commit -m "feat: implement login page"
```

---

## Task 7: RegisterTrainerPage + VerifyPage

**Files:**
- Modify: `src/pages/RegisterTrainerPage.jsx`
- Modify: `src/pages/VerifyPage.jsx`

- [ ] **Step 1: Implement RegisterTrainerPage**

```jsx
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
  borderRadius: 12, padding: '40px 36px', width: '100%', maxWidth: 440,
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

export default function RegisterTrainerPage() {
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
      options: { emailRedirectTo: `${window.location.origin}/profile/setup` },
    })

    setLoading(false)

    if (error) { setServerError(error.message); return }

    navigate('/verify', { state: { email } })
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Step 1 of 5
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, color: '#EEF2EE', margin: '0 0 8px', fontWeight: 700, letterSpacing: 1 }}>
          Create your account
        </h1>
        <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 15, margin: '0 0 28px' }}>
          You'll verify your email before completing your profile.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.email ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="email" />
            {errors.email && <p style={ERR_STYLE}>{errors.email}</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={LABEL_STYLE}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ ...INPUT_STYLE, borderColor: errors.password ? '#f87171' : 'rgba(238,242,238,0.2)' }}
              autoComplete="new-password" />
            {errors.password && <p style={ERR_STYLE}>{errors.password}</p>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={LABEL_STYLE}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
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
          <Link to="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement VerifyPage**

```jsx
import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function VerifyPage() {
  const { state } = useLocation()
  const email = state?.email ?? ''
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleResend() {
    if (!email) return
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    setResent(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1a0e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>📬</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
          Check your inbox
        </h1>
        <p style={{ color: 'rgba(238,242,238,0.7)', fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
          We sent a verification link to{' '}
          {email && <strong style={{ color: '#EEF2EE' }}>{email}</strong>}.
          Click the link to continue setting up your profile.
        </p>
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 28 }}>
          The link expires in 24 hours. Check your spam folder if you don't see it.
        </p>

        {email && (
          <button onClick={handleResend} disabled={resending || resent}
            style={{ background: 'transparent', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: resent ? 'default' : 'pointer', opacity: resending ? 0.6 : 1 }}>
            {resent ? 'Email resent ✓' : resending ? 'Resending…' : 'Resend verification email'}
          </button>
        )}

        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 24 }}>
          <Link to="/login" style={{ color: 'rgba(238,242,238,0.5)', textDecoration: 'none' }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Manual test**

Navigate to `http://localhost:5173/register/trainer`. Verify:
- Form renders with email, password, confirm password
- Mismatched passwords shows error
- Short password shows error

- [ ] **Step 4: Commit**

```bash
git add src/pages/RegisterTrainerPage.jsx src/pages/VerifyPage.jsx
git commit -m "feat: implement trainer registration and email verify pages"
```

---

## Task 8: FileUpload + MultiSelect shared components

**Files:**
- Modify: `src/components/FileUpload.jsx`
- Create: `src/components/FileUpload.test.jsx`
- Create: `src/components/MultiSelect.jsx`

- [ ] **Step 1: Write FileUpload tests first**

Create `src/components/FileUpload.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import FileUpload from './FileUpload'

describe('FileUpload', () => {
  it('renders the label', () => {
    render(<FileUpload label="Upload ID" onChange={() => {}} files={[]} />)
    expect(screen.getByText('Upload ID')).toBeInTheDocument()
  })

  it('calls onChange with valid file', () => {
    const onChange = vi.fn()
    render(<FileUpload label="Upload" onChange={onChange} files={[]} />)
    const input = screen.getByRole('textbox', { hidden: true }) || document.querySelector('input[type="file"]')
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 1024 })
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
    expect(onChange).toHaveBeenCalledWith([file])
  })

  it('does not call onChange with invalid file type', () => {
    const onChange = vi.fn()
    render(<FileUpload label="Upload" onChange={onChange} files={[]} />)
    const file = new File(['x'], 'test.exe', { type: 'application/octet-stream' })
    Object.defineProperty(file, 'size', { value: 100 })
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/PDF, JPG, and PNG/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test FileUpload
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/components/FileUpload.jsx**

```jsx
import { useState, useRef } from 'react'
import { validateFile } from '../utils/validation'

export default function FileUpload({ label, onChange, files = [], maxFiles = 5, optional = false }) {
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function handleChange(e) {
    setError('')
    const selected = Array.from(e.target.files)
    if (!selected.length) return

    const validationError = validateFile(selected[0])
    if (validationError) { setError(validationError); return }

    if (files.length + selected.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed.`)
      return
    }

    onChange([...files, ...selected])
    e.target.value = '' // reset input so same file can be re-added
  }

  function removeFile(index) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <label style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500 }}>
          {label}
        </label>
        {optional && (
          <span style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12 }}>optional</span>
        )}
      </div>

      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(74,222,128,0.4)',
          borderRadius: 6, padding: '10px 16px', color: '#4ade80', fontFamily: 'var(--font-body)',
          fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
        }}>
        + Add file
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {error && (
        <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 4 }}>{error}</p>
      )}

      {files.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
          {files.map((file, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(238,242,238,0.06)' }}>
              <span style={{ flex: 1, color: 'rgba(238,242,238,0.8)', fontFamily: 'var(--font-body)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name ?? file}
              </span>
              <button type="button" onClick={() => removeFile(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ color: 'rgba(238,242,238,0.3)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 4 }}>
        PDF, JPG, or PNG · Max 5MB per file · Up to {maxFiles} files
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/MultiSelect.jsx**

```jsx
import { useState } from 'react'

export default function MultiSelect({ label, options, value = [], onChange, allowCustom = false }) {
  const [customInput, setCustomInput] = useState('')

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt])
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setCustomInput('')
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const selected = value.includes(opt)
          return (
            <button key={opt} type="button" onClick={() => toggle(opt)}
              style={{
                background: selected ? '#4ade80' : 'rgba(255,255,255,0.06)',
                color: selected ? '#0d1a0e' : 'rgba(238,242,238,0.8)',
                border: `1px solid ${selected ? '#4ade80' : 'rgba(238,242,238,0.2)'}`,
                borderRadius: 20, padding: '6px 14px', fontSize: 13,
                fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: selected ? 600 : 400,
              }}>
              {opt}
            </button>
          )
        })}
      </div>

      {allowCustom && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Add custom…"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)',
              borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)',
              fontSize: 14, outline: 'none',
            }}
          />
          <button type="button" onClick={addCustom}
            style={{
              background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
              color: '#4ade80', borderRadius: 6, padding: '8px 14px', fontSize: 14,
              fontFamily: 'var(--font-body)', cursor: 'pointer',
            }}>
            Add
          </button>
        </div>
      )}

      {allowCustom && value.filter(v => !options.includes(v)).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {value.filter(v => !options.includes(v)).map(v => (
            <span key={v} style={{
              background: '#4ade80', color: '#0d1a0e', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {v}
              <button type="button" onClick={() => onChange(value.filter(x => x !== v))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0d1a0e', fontSize: 14, lineHeight: 1, padding: 0 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run FileUpload tests**

```bash
npm test FileUpload
```

Expected: all 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/FileUpload.jsx src/components/FileUpload.test.jsx src/components/MultiSelect.jsx
git commit -m "feat: add FileUpload and MultiSelect shared components"
```

---

## Task 9: ProfileSetupPage

**Files:**
- Modify: `src/pages/ProfileSetupPage.jsx`

- [ ] **Step 1: Implement ProfileSetupPage**

This is a 5-step form. Replace the stub with the full implementation:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { validateRequired } from '../utils/validation'
import FileUpload from '../components/FileUpload'
import MultiSelect from '../components/MultiSelect'

const SPECIALTIES = ['Strength Training', 'HIIT', 'Yoga', 'Pilates', 'Bodybuilding', 'Crossfit', 'Running', 'Cycling', 'Boxing', 'Rehabilitation', 'Weight Loss', 'Nutrition']
const SESSION_TYPES = ['In-person', 'Virtual', 'Both']
const LOCATIONS = ['Central', 'CBD', 'Orchard', 'East', 'West', 'North', 'Northeast', 'Online']

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

const STEP_TITLES = ['', 'Basic info', 'Professional', 'Documents', 'Commercial']

export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { session, refreshProfile } = useAuth()
  const [step, setStep] = useState(2) // Steps 2-5 (step 1 was account creation)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Step 2 — Basic info
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [photoFiles, setPhotoFiles] = useState([])

  // Step 3 — Professional
  const [certNames, setCertNames] = useState([])
  const [specialties, setSpecialties] = useState([])
  const [yearsExp, setYearsExp] = useState('')
  const [certFiles, setCertFiles] = useState([])

  // Step 4 — Documents
  const [govIdFiles, setGovIdFiles] = useState([])
  const [cprFiles, setCprFiles] = useState([])
  const [insuranceFiles, setInsuranceFiles] = useState([])

  // Step 5 — Commercial
  const [hourlyRate, setHourlyRate] = useState('')
  const [sessionTypes, setSessionTypes] = useState([])
  const [locations, setLocations] = useState([])
  const [bio, setBio] = useState('')

  function validateStep2() {
    const errs = {}
    const nameErr = validateRequired(fullName, 'Full name')
    const phoneErr = validateRequired(phone, 'Phone number')
    if (nameErr) errs.fullName = nameErr
    if (phoneErr) errs.phone = phoneErr
    if (photoFiles.length === 0) errs.photo = 'Profile photo is required.'
    return errs
  }

  function validateStep3() {
    const errs = {}
    if (specialties.length === 0) errs.specialties = 'Select at least one specialty.'
    const expErr = validateRequired(yearsExp, 'Years of experience')
    if (expErr) errs.yearsExp = expErr
    if (certFiles.length === 0) errs.certFiles = 'Upload at least one certification document.'
    return errs
  }

  function validateStep4() {
    const errs = {}
    if (govIdFiles.length === 0) errs.govId = 'Government ID is required.'
    if (cprFiles.length === 0) errs.cpr = 'CPR/First Aid certificate is required.'
    return errs
  }

  function validateStep5() {
    const errs = {}
    const rateErr = validateRequired(hourlyRate, 'Hourly rate')
    if (rateErr) errs.hourlyRate = rateErr
    else if (isNaN(Number(hourlyRate)) || Number(hourlyRate) <= 0) errs.hourlyRate = 'Enter a valid hourly rate in SGD.'
    if (sessionTypes.length === 0) errs.sessionTypes = 'Select at least one session type.'
    if (locations.length === 0) errs.locations = 'Select at least one location.'
    const bioErr = validateRequired(bio, 'Bio')
    if (bioErr) errs.bio = bioErr
    return errs
  }

  function handleNext() {
    let errs = {}
    if (step === 2) errs = validateStep2()
    if (step === 3) errs = validateStep3()
    if (step === 4) errs = validateStep4()
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep(s => s + 1)
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
    const errs = validateStep5()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setServerError('')

    try {
      const userId = session.user.id

      // Upload profile photo
      const [profilePhotoUrl] = await uploadFiles('profile-photos', userId, 'photo', photoFiles)

      // Upload documents
      const certUrls = await uploadFiles('documents', userId, 'certifications', certFiles)
      const govIdUrls = await uploadFiles('documents', userId, 'government_id', govIdFiles)
      const cprUrls = await uploadFiles('documents', userId, 'cpr_cert', cprFiles)
      const insuranceUrls = await uploadFiles('documents', userId, 'insurance', insuranceFiles)

      const documents = {
        certifications: certUrls,
        government_id: govIdUrls,
        cpr_cert: cprUrls,
        insurance: insuranceUrls,
      }

      const { error } = await supabase.rpc('submit_trainer_profile', {
        p_full_name: fullName.trim(),
        p_phone: phone.trim(),
        p_profile_photo_url: profilePhotoUrl,
        p_bio: bio.trim(),
        p_certifications: certNames,
        p_specialties: specialties,
        p_years_experience: parseInt(yearsExp, 10),
        p_hourly_rate: parseInt(hourlyRate, 10),
        p_session_types: sessionTypes,
        p_locations_served: locations,
        p_documents: documents,
      })

      if (error) throw new Error(error.message)

      await refreshProfile()
      navigate('/dashboard/trainer')
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const stepPct = ((step - 2) / 4) * 100 + 25

  return (
    <div style={PAGE_STYLE}>
      <div style={CARD_STYLE}>
        {/* Progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>
              Step {step} of 5 — {STEP_TITLES[step - 1]}
            </p>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${stepPct}%`, background: '#4ade80', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Step 2 — Basic info */}
        {step === 2 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Tell us about yourself</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} style={INPUT_STYLE} />
              {errors.fullName && <p style={ERR_STYLE}>{errors.fullName}</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Phone number</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} style={INPUT_STYLE} placeholder="+65 9xxx xxxx" />
              {errors.phone && <p style={ERR_STYLE}>{errors.phone}</p>}
            </div>
            <FileUpload label="Profile photo" files={photoFiles} onChange={setPhotoFiles} maxFiles={1} />
            {errors.photo && <p style={ERR_STYLE}>{errors.photo}</p>}
          </>
        )}

        {/* Step 3 — Professional */}
        {step === 3 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 24, fontWeight: 700 }}>Your qualifications</h2>
            <MultiSelect label="Specialties" options={SPECIALTIES} value={specialties} onChange={setSpecialties} />
            {errors.specialties && <p style={ERR_STYLE}>{errors.specialties}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Years of experience</label>
              <input type="number" min="0" max="50" value={yearsExp} onChange={e => setYearsExp(e.target.value)} style={{ ...INPUT_STYLE, width: 120 }} />
              {errors.yearsExp && <p style={ERR_STYLE}>{errors.yearsExp}</p>}
            </div>
            <MultiSelect label="Certification names" options={[]} value={certNames} onChange={setCertNames} allowCustom />
            <FileUpload label="Certification documents" files={certFiles} onChange={setCertFiles} />
            {errors.certFiles && <p style={ERR_STYLE}>{errors.certFiles}</p>}
          </>
        )}

        {/* Step 4 — Documents */}
        {step === 4 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: '#EEF2EE', marginBottom: 8, fontWeight: 700 }}>Verification documents</h2>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              These are reviewed by our team and never shared publicly.
            </p>
            <FileUpload label="Government-issued ID (NRIC / Passport)" files={govIdFiles} onChange={setGovIdFiles} maxFiles={2} />
            {errors.govId && <p style={ERR_STYLE}>{errors.govId}</p>}
            <FileUpload label="CPR / First Aid certificate" files={cprFiles} onChange={setCprFiles} maxFiles={2} />
            {errors.cpr && <p style={ERR_STYLE}>{errors.cpr}</p>}
            <FileUpload label="Professional liability insurance" files={insuranceFiles} onChange={setInsuranceFiles} maxFiles={2} optional />
          </>
        )}

        {/* Step 5 — Commercial */}
        {step === 5 && (
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
            <MultiSelect label="Session types" options={SESSION_TYPES} value={sessionTypes} onChange={setSessionTypes} />
            {errors.sessionTypes && <p style={ERR_STYLE}>{errors.sessionTypes}</p>}
            <MultiSelect label="Locations served" options={LOCATIONS} value={locations} onChange={setLocations} />
            {errors.locations && <p style={ERR_STYLE}>{errors.locations}</p>}
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                rows={4}
                placeholder="Tell potential clients about your training style, background, and what makes you unique…"
                style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }} />
              {errors.bio && <p style={ERR_STYLE}>{errors.bio}</p>}
            </div>
            {serverError && (
              <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 12, padding: '10px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 6 }}>
                {serverError}
              </p>
            )}
          </>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
          {step > 2 && (
            <button type="button" onClick={() => setStep(s => s - 1)} style={BTN_GHOST}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 5 ? (
            <button type="button" onClick={handleNext} style={BTN_PRIMARY}>
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              style={{ ...BTN_PRIMARY, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Manual test**

```bash
npm run dev
```

Navigate to `http://localhost:5173/profile/setup`. Since it's behind ProtectedRoute, you'll be redirected to `/login` — that confirms the guard works. Log in with a test account to access the form.

Verify:
- Progress bar advances through steps 2→5
- Each step validates on "Continue"
- Step 4 insurance field shows "optional"
- Step 5 shows bio textarea

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfileSetupPage.jsx
git commit -m "feat: implement multi-step trainer profile setup form"
```

---

## Task 10: TrainerDashboardPage

**Files:**
- Modify: `src/pages/TrainerDashboardPage.jsx`

- [ ] **Step 1: Implement TrainerDashboardPage**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PAGE_STYLE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const CONTAINER = { maxWidth: 680, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '28px 32px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' }
const VALUE = { color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 15, marginBottom: 16 }

const STATUS_COLORS = {
  pending:  { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.4)', text: '#fbbf24' },
  approved: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.4)', text: '#4ade80' },
  rejected: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.4)', text: '#f87171' },
}

const STATUS_MESSAGES = {
  pending: 'Your application is under review. We'll get back to you within 48 hours.',
  approved: 'Your profile is approved and live. Clients can find you on FitnessGuru.',
  rejected: 'Your application was not approved at this time.',
}

export default function TrainerDashboardPage() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [trainerProfile, setTrainerProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    if (!session) return
    supabase
      .from('trainer_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => { setTrainerProfile(data); setLoading(false) })
  }, [session])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setPwMsg('Password must be at least 8 characters.'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwMsg(error.message)
    else { setPwMsg('Password updated.'); setNewPassword(''); setChangingPassword(false) }
  }

  if (loading) {
    return (
      <div style={{ ...PAGE_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </div>
    )
  }

  if (!trainerProfile) {
    return (
      <div style={{ ...PAGE_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16 }}>Profile not found.</p>
        <button onClick={() => navigate('/profile/setup')} style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }}>
          Complete your profile
        </button>
      </div>
    )
  }

  const status = trainerProfile.status
  const sc = STATUS_COLORS[status] ?? STATUS_COLORS.pending

  return (
    <div style={PAGE_STYLE}>
      <div style={CONTAINER}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, margin: '0 0 4px', letterSpacing: 1 }}>
              {profile?.full_name ?? 'Your Dashboard'}
            </h1>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>
              {session?.user?.email}
            </p>
          </div>
          <button onClick={handleSignOut}
            style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {/* Status banner */}
        <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: '18px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ background: sc.text, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: status === 'approved' ? '#0d1a0e' : '#0d1a0e', textTransform: 'uppercase', letterSpacing: 1 }}>
              {status}
            </span>
          </div>
          <p style={{ color: sc.text, fontFamily: 'var(--font-body)', fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            {STATUS_MESSAGES[status]}
          </p>
          {status === 'rejected' && trainerProfile.admin_notes && (
            <p style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 8, fontStyle: 'italic' }}>
              Note: {trainerProfile.admin_notes}
            </p>
          )}
        </div>

        {/* Profile summary */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 20px', fontWeight: 700 }}>Profile</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div>
              <span style={LABEL}>Specialties</span>
              <p style={VALUE}>{trainerProfile.specialties?.join(', ') || '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Experience</span>
              <p style={VALUE}>{trainerProfile.years_experience ? `${trainerProfile.years_experience} years` : '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Hourly rate</span>
              <p style={VALUE}>{trainerProfile.hourly_rate ? `$${trainerProfile.hourly_rate} SGD` : '—'}</p>
            </div>
            <div>
              <span style={LABEL}>Session types</span>
              <p style={VALUE}>{trainerProfile.session_types?.join(', ') || '—'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={LABEL}>Locations</span>
              <p style={VALUE}>{trainerProfile.locations_served?.join(', ') || '—'}</p>
            </div>
            {profile?.bio && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={LABEL}>Bio</span>
                <p style={{ ...VALUE, lineHeight: 1.6 }}>{profile.bio}</p>
              </div>
            )}
          </div>
          <button onClick={() => navigate('/profile/setup')}
            style={{ marginTop: 8, background: 'transparent', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Edit profile
          </button>
        </div>

        {/* Documents */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Documents</h3>
          {Object.entries(trainerProfile.documents ?? {}).map(([type, urls]) => (
            urls?.length > 0 && (
              <div key={type} style={{ marginBottom: 12 }}>
                <span style={LABEL}>{type.replace(/_/g, ' ')}</span>
                {urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 14, textDecoration: 'none', marginBottom: 4 }}>
                    View document {i + 1} →
                  </a>
                ))}
              </div>
            )
          ))}
        </div>

        {/* Account settings */}
        <div style={CARD}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#EEF2EE', margin: '0 0 16px', fontWeight: 700 }}>Account</h3>
          <span style={LABEL}>Email</span>
          <p style={{ ...VALUE, marginBottom: 16 }}>{session?.user?.email}</p>

          {!changingPassword ? (
            <button onClick={() => setChangingPassword(true)}
              style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
              Change password
            </button>
          ) : (
            <form onSubmit={handleChangePassword}>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  Update
                </button>
                <button type="button" onClick={() => { setChangingPassword(false); setPwMsg('') }}
                  style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              {pwMsg && <p style={{ color: pwMsg === 'Password updated.' ? '#4ade80' : '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 8 }}>{pwMsg}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/TrainerDashboardPage.jsx
git commit -m "feat: implement trainer dashboard page"
```

---

## Task 11: Admin page

**Files:**
- Modify: `src/pages/AdminPage.jsx`

- [ ] **Step 1: Implement AdminPage**

```jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PAGE_STYLE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const CONTAINER = { maxWidth: 900, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const TAB_BTN = (active) => ({
  background: active ? '#4ade80' : 'transparent',
  color: active ? '#0d1a0e' : 'rgba(238,242,238,0.6)',
  border: `1px solid ${active ? '#4ade80' : 'rgba(238,242,238,0.2)'}`,
  borderRadius: 6, padding: '8px 20px', fontSize: 14, fontFamily: 'var(--font-body)',
  fontWeight: active ? 700 : 400, cursor: 'pointer',
})
const FIELD_LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 2 }
const FIELD_VAL = { color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 12 }

export default function AdminPage() {
  const { session, signOut } = useAuth()
  const [tab, setTab] = useState('pending')
  const [trainers, setTrainers] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [actionStates, setActionStates] = useState({}) // { [id]: 'approving'|'rejecting'|null }
  const [notes, setNotes] = useState({}) // { [id]: string }
  const [expandedDocs, setExpandedDocs] = useState({}) // { [id]: bool }

  async function load() {
    setLoading(true)
    const { data: tps } = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('status', tab)
      .order('created_at', { ascending: false })

    if (!tps?.length) { setTrainers([]); setLoading(false); return }

    // Fetch profiles for each trainer
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, phone, profile_photo_url, bio')
      .in('id', tps.map(t => t.id))

    const profMap = {}
    profs?.forEach(p => { profMap[p.id] = p })

    // Fetch emails from auth (via profiles — email is on auth.users, not profiles)
    // We store email in the session but not profiles table. For admin view,
    // fetch emails via admin API is not available with anon key.
    // Workaround: show what we have. Email is shown from profiles.
    // Note: to show emails, add an `email` column to profiles and populate on signup.
    // For now display what's available.

    setTrainers(tps)
    setProfiles(profMap)
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  async function approve(trainerId) {
    setActionStates(s => ({ ...s, [trainerId]: 'approving' }))
    const { error } = await supabase
      .from('trainer_profiles')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), admin_notes: notes[trainerId] ?? null })
      .eq('id', trainerId)

    if (!error) {
      // Trigger notification email via Edge Function
      await supabase.functions.invoke('notify-trainer', {
        body: {
          trainerId,
          trainerName: profiles[trainerId]?.full_name ?? 'Trainer',
          status: 'approved',
          adminNotes: null,
        },
      })
      load()
    }
    setActionStates(s => ({ ...s, [trainerId]: null }))
  }

  async function reject(trainerId) {
    setActionStates(s => ({ ...s, [trainerId]: 'rejecting' }))
    const { error } = await supabase
      .from('trainer_profiles')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString(), admin_notes: notes[trainerId] ?? null })
      .eq('id', trainerId)

    if (!error) {
      await supabase.functions.invoke('notify-trainer', {
        body: {
          trainerId,
          trainerName: profiles[trainerId]?.full_name ?? 'Trainer',
          status: 'rejected',
          adminNotes: notes[trainerId] ?? null,
        },
      })
      load()
    }
    setActionStates(s => ({ ...s, [trainerId]: null }))
  }

  return (
    <div style={PAGE_STYLE}>
      <div style={CONTAINER}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, color: '#EEF2EE', fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            Admin Dashboard
          </h1>
          <button onClick={signOut}
            style={{ background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['pending', 'approved', 'rejected'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={TAB_BTN(tab === t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading && <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading…</p>}

        {!loading && trainers.length === 0 && (
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 15, padding: '40px 0' }}>
            No {tab} applications.
          </p>
        )}

        {trainers.map(trainer => {
          const prof = profiles[trainer.id] ?? {}
          const docsExpanded = expandedDocs[trainer.id]
          const acting = actionStates[trainer.id]

          return (
            <div key={trainer.id} style={CARD}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {prof.profile_photo_url && (
                  <img src={prof.profile_photo_url} alt={prof.full_name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#EEF2EE', fontWeight: 700, margin: '0 0 4px', letterSpacing: 0.5 }}>
                    {prof.full_name ?? 'Unknown'}
                  </h3>
                  <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
                    Applied {new Date(trainer.created_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div>
                  <span style={FIELD_LABEL}>Phone</span>
                  <p style={FIELD_VAL}>{prof.phone ?? '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Experience</span>
                  <p style={FIELD_VAL}>{trainer.years_experience ? `${trainer.years_experience} years` : '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Specialties</span>
                  <p style={FIELD_VAL}>{trainer.specialties?.join(', ') || '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Hourly rate</span>
                  <p style={FIELD_VAL}>{trainer.hourly_rate ? `$${trainer.hourly_rate} SGD` : '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Session types</span>
                  <p style={FIELD_VAL}>{trainer.session_types?.join(', ') || '—'}</p>
                </div>
                <div>
                  <span style={FIELD_LABEL}>Locations</span>
                  <p style={FIELD_VAL}>{trainer.locations_served?.join(', ') || '—'}</p>
                </div>
                {prof.bio && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={FIELD_LABEL}>Bio</span>
                    <p style={{ ...FIELD_VAL, lineHeight: 1.6 }}>{prof.bio}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div style={{ borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 16, marginTop: 4 }}>
                <button onClick={() => setExpandedDocs(s => ({ ...s, [trainer.id]: !s[trainer.id] }))}
                  style={{ background: 'transparent', border: 'none', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: docsExpanded ? 12 : 0 }}>
                  {docsExpanded ? '▲ Hide documents' : '▼ View documents'}
                </button>

                {docsExpanded && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                    {Object.entries(trainer.documents ?? {}).map(([type, urls]) => (
                      urls?.length > 0 && (
                        <div key={type}>
                          <span style={FIELD_LABEL}>{type.replace(/_/g, ' ')}</span>
                          {urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'block', color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, textDecoration: 'none', marginBottom: 2 }}>
                              Document {i + 1} →
                            </a>
                          ))}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Admin notes + actions (Pending only) */}
              {tab === 'pending' && (
                <div style={{ borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 16, marginTop: 16 }}>
                  <label style={{ ...FIELD_LABEL, marginBottom: 6 }}>Admin notes (included in rejection email)</label>
                  <textarea
                    value={notes[trainer.id] ?? ''}
                    onChange={e => setNotes(s => ({ ...s, [trainer.id]: e.target.value }))}
                    rows={2}
                    placeholder="Optional — add a note visible to you and sent to trainer if rejected…"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => approve(trainer.id)} disabled={!!acting}
                      style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: acting ? 'default' : 'pointer', opacity: acting === 'approving' ? 0.6 : 1 }}>
                      {acting === 'approving' ? 'Approving…' : 'Approve'}
                    </button>
                    <button onClick={() => reject(trainer.id)} disabled={!!acting}
                      style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: acting ? 'default' : 'pointer', opacity: acting === 'rejecting' ? 0.6 : 1 }}>
                      {acting === 'rejecting' ? 'Rejecting…' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Show review date for non-pending */}
              {tab !== 'pending' && trainer.reviewed_at && (
                <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 12, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 12 }}>
                  Reviewed {new Date(trainer.reviewed_at).toLocaleDateString('en-SG')}
                  {trainer.admin_notes && ` · Note: ${trainer.admin_notes}`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AdminPage.jsx
git commit -m "feat: implement admin dashboard with approve/reject workflow"
```

---

## Task 12: Edge Function — notify-trainer

**Files:**
- Create: `supabase/functions/notify-trainer/index.ts`

> **Manual prerequisite:** Install the Supabase CLI: `npm install -g supabase`

- [ ] **Step 1: Create the Edge Function**

```bash
mkdir -p supabase/functions/notify-trainer
```

Create `supabase/functions/notify-trainer/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@fitnessguru.sg'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  const { trainerName, trainerEmail, status, adminNotes } = await req.json()

  if (!trainerEmail || !status) {
    return new Response(JSON.stringify({ error: 'trainerEmail and status are required' }), { status: 400 })
  }

  const approved = status === 'approved'

  const subject = approved
    ? '🎉 Your FitnessGuru application has been approved!'
    : 'Update on your FitnessGuru application'

  const html = approved
    ? `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Welcome to FitnessGuru, ${trainerName ?? 'Trainer'}!</h2>
        <p>Your trainer profile has been reviewed and <strong>approved</strong>. You're now part of the FitnessGuru network.</p>
        <p>Log in to your dashboard to view your live profile and stay updated as we launch the platform.</p>
        <a href="https://fitnessguru.sg/login" style="display: inline-block; background: #4ade80; color: #0d1a0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Go to your dashboard
        </a>
      </div>
    `
    : `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
        <h2 style="color: #0d1a0e;">Hi ${trainerName ?? 'Trainer'},</h2>
        <p>Thank you for applying to FitnessGuru. After reviewing your application, we're unable to approve your profile at this time.</p>
        ${adminNotes ? `<p style="background: #f5f5f5; padding: 12px 16px; border-radius: 6px; color: #333;"><strong>Note from our team:</strong> ${adminNotes}</p>` : ''}
        <p>If you have questions or would like to reapply, please contact us at <a href="mailto:support@fitnessguru.sg">support@fitnessguru.sg</a>.</p>
      </div>
    `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: trainerEmail, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: body }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
})
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy notify-trainer
```

- [ ] **Step 3: Set the RESEND_API_KEY secret**

Sign up at https://resend.com (free tier: 3,000 emails/month). Get your API key from the dashboard.

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

> **Note:** Resend requires a verified sending domain. For testing, use the Resend sandbox or verify your domain in the Resend dashboard.

- [ ] **Step 4: Update AdminPage to pass trainerEmail**

The AdminPage currently calls `notify-trainer` without `trainerEmail` because we don't store email in the `profiles` table. Fix this by adding an `email` column to profiles.

In the SQL editor, run:
```sql
alter table public.profiles add column if not exists email text;
```

Update `submit_trainer_profile` RPC to also save the email (or handle this in `ProfileSetupPage`).

In `ProfileSetupPage.jsx`, add the email to the RPC call. First, update the RPC in SQL to accept email:

```sql
-- Add to submit_trainer_profile parameters and body:
-- Parameter: p_email text
-- In the insert/update: email = p_email
```

Run this updated SQL in Supabase SQL Editor:

```sql
create or replace function public.submit_trainer_profile(
  p_full_name text,
  p_phone text,
  p_email text,
  p_profile_photo_url text,
  p_bio text,
  p_certifications text[],
  p_specialties text[],
  p_years_experience int,
  p_hourly_rate int,
  p_session_types text[],
  p_locations_served text[],
  p_documents jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role, full_name, phone, email, profile_photo_url, bio)
  values (auth.uid(), 'trainer', p_full_name, p_phone, p_email, p_profile_photo_url, p_bio)
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    profile_photo_url = excluded.profile_photo_url,
    bio = excluded.bio;

  insert into public.trainer_profiles (
    id, certifications, specialties, years_experience, hourly_rate,
    session_types, locations_served, documents, status
  )
  values (
    auth.uid(), p_certifications, p_specialties, p_years_experience, p_hourly_rate,
    p_session_types, p_locations_served, p_documents, 'pending'
  )
  on conflict (id) do update set
    certifications = excluded.certifications,
    specialties = excluded.specialties,
    years_experience = excluded.years_experience,
    hourly_rate = excluded.hourly_rate,
    session_types = excluded.session_types,
    locations_served = excluded.locations_served,
    documents = excluded.documents,
    status = 'pending',
    reviewed_at = null,
    admin_notes = null;
end;
$$;
```

In `ProfileSetupPage.jsx`, update the RPC call to include `p_email: session.user.email`.

In `AdminPage.jsx`, update the profiles query to include `email`:
```js
.select('id, full_name, phone, email, profile_photo_url, bio')
```

And update `approve`/`reject` to pass `trainerEmail: profiles[trainerId]?.email`:
```js
body: { trainerId, trainerName: profiles[trainerId]?.full_name, trainerEmail: profiles[trainerId]?.email, status: 'approved', adminNotes: null }
```

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ src/pages/ProfileSetupPage.jsx src/pages/AdminPage.jsx
git commit -m "feat: add notify-trainer edge function and wire trainer email to admin actions"
```

---

## Task 13: Wire landing CTAs + Vercel migration

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Manual steps: Vercel setup

- [ ] **Step 1: Disable GitHub Pages workflow**

Open `.github/workflows/deploy.yml` and add `if: false` to disable it:

```yaml
on:
  push:
    branches: ['main']
  workflow_dispatch:

jobs:
  build:
    if: false  # Disabled — site now deployed via Vercel
    runs-on: ubuntu-latest
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Build to confirm no errors**

```bash
npm run build
```

Expected: build completes with no errors. Check dist/ for output.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: disable GitHub Pages workflow, migrate to Vercel"
git push origin main
```

- [ ] **Step 5: Connect Vercel (manual)**

1. Go to https://vercel.com → New Project → Import Git Repository → select `FitnessGuru`
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click Deploy

- [ ] **Step 6: Update Supabase Auth redirect URLs**

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-project.vercel.app`
- Redirect URLs: add `https://your-project.vercel.app/profile/setup`

- [ ] **Step 7: Smoke test all flows**

Test these flows end-to-end:

**Flow 1 — Trainer registration:**
1. Go to `https://your-project.vercel.app/`
2. Select trainer mode → click "Apply as a Trainer"
3. Fill in email + password → submit → land on `/verify`
4. Click verification email link → land on `/profile/setup`
5. Complete all 5 steps → submit → land on `/dashboard/trainer` with status "pending"

**Flow 2 — Admin approval:**
1. Log in with admin email/password at `/login`
2. Navigate to `/admin` → see trainer in Pending tab
3. Add a note → click Approve
4. Trainer receives approval email
5. Trainer logs in → dashboard shows "approved" status

**Flow 3 — Returning trainer:**
1. Log out from trainer dashboard
2. Go to `/login` → sign in
3. Redirect to `/dashboard/trainer` with correct status

**Flow 4 — Unauthorized access:**
1. Log out
2. Navigate directly to `/dashboard/trainer` → redirected to `/login`
3. Navigate to `/admin` without admin role → redirected to `/`
