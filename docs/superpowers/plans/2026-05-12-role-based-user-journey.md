# Role-Based User Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the FitnessGuru landing page so visitors first self-select client or trainer, then see a fully tailored page for their role.

**Architecture:** Role is stored in `localStorage` (`fg_role = 'client' | 'trainer'`). The `App` component reads this on mount and conditionally renders one of three branches: `SplitHero` (no role set), `ClientPage`, or `TrainerPage`. All code lives in `src/App.jsx`. A fade transition (opacity 0→1, 280ms) plays on every role change.

**Tech Stack:** React 18, Vite, Tailwind CSS v4 (build only — no utility classes in JSX), inline `style` objects throughout, Barlow Condensed (`var(--font-heading)`) + Barlow (`var(--font-body)`), dark canvas `#0d1a0e`, accent `#4ade80`, brand green `#2d6a2e`.

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/App.jsx` | Everything — role state, Nav props, new components, remove old sections |

---

### Task 1: Role state + App render shell

**Files:**
- Modify: `src/App.jsx` — `App` function (lines 1003–1031)

- [ ] **Step 1: Replace the `App` function**

Find the existing `export default function App()` block and replace it entirely:

```jsx
export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('fg_role'))
  const [fading, setFading] = useState(false)

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
      <a href="#main-content"
        style={{
          position: 'absolute', top: -40, left: 0, background: '#2d6a2e', color: '#fff',
          padding: '8px 16px', zIndex: 9999, fontFamily: 'var(--font-body)', fontSize: 14,
          textDecoration: 'none', borderRadius: '0 0 8px 0', transition: 'top 0.2s',
        }}
        onFocus={e => e.target.style.top = '0'}
        onBlur={e => e.target.style.top = '-40px'}>
        Skip to main content
      </a>
      <Nav role={role} onSwitch={switchRole} />
      <main
        id="main-content"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease-out' }}
      >
        {role === null && <SplitHero onSelect={selectRole} />}
        {role === 'client' && <ClientPage />}
        {role === 'trainer' && <TrainerPage />}
      </main>
      {role !== null && <Footer />}
    </>
  )
}
```

- [ ] **Step 2: Add stub components just above `App`**

Add these three stubs directly above the `export default function App()` line so the file compiles:

```jsx
function SplitHero({ onSelect }) {
  return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1a0e' }}><button onClick={() => onSelect('client')} style={{ color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 24 }}>STUB — click to go client</button><button onClick={() => onSelect('trainer')} style={{ color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 24, marginLeft: 40 }}>STUB — click to go trainer</button></div>
}

function ClientPage() {
  return <div style={{ minHeight: '100dvh', paddingTop: 100, background: '#0d1a0e', color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: 40, textAlign: 'center' }}>CLIENT PAGE — coming soon</div>
}

function TrainerPage() {
  return <div style={{ minHeight: '100dvh', paddingTop: 100, background: '#0d1a0e', color: '#4ade80', fontFamily: 'var(--font-heading)', fontSize: 40, textAlign: 'center' }}>TRAINER PAGE — coming soon</div>
}
```

- [ ] **Step 3: Verify the app compiles and role branching works**

```bash
cd /Users/calvintee/FitnessGuru && npm run dev
```

Open http://localhost:5173. Expected:
- No stored role → split hero stub with two buttons
- Click "client" → client stub page renders, URL stays the same
- Refresh → client page loads directly (localStorage persists)
- Open DevTools → Application → localStorage → delete `fg_role` → refresh → stub hero reappears

- [ ] **Step 4: Commit**

```bash
cd /Users/calvintee/FitnessGuru
git add src/App.jsx
git commit -m "feat: add role state management and App render branching

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Update Nav for role-aware switch link

**Files:**
- Modify: `src/App.jsx` — `Nav` function (lines 67–165)

- [ ] **Step 1: Replace the `Nav` function signature and desktop/mobile content**

Find `function Nav() {` and replace the entire `Nav` function with:

```jsx
function Nav({ role, onSwitch }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header role="banner"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'background 0.3s, box-shadow 0.3s',
        background: scrolled ? 'rgba(13,26,14,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.06)' : 'none',
      }}>
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <a href="#" aria-label="FitnessGuru home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#2d6a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '-0.5px' }}>FG</span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#EEF2EE', letterSpacing: '0.01em' }}>
            Fitness<span style={{ color: '#4ade80' }}>Guru</span>
          </span>
        </a>

        {/* Desktop right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="hidden-mobile">
          {role && (
            <>
              <a href="#how-it-works" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'rgba(238,242,238,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#EEF2EE'}
                onMouseLeave={e => e.target.style.color = 'rgba(238,242,238,0.7)'}>
                How It Works
              </a>
              <button onClick={onSwitch}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'rgba(238,242,238,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#4ade80'}
                onMouseLeave={e => e.target.style.color = 'rgba(238,242,238,0.45)'}>
                Switch to {role === 'client' ? 'Trainer' : 'Client'} view
              </button>
            </>
          )}
          <a href="#waitlist" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
            color: '#fff', textDecoration: 'none', letterSpacing: '0.04em',
            background: '#2d6a2e', padding: '9px 22px', borderRadius: 8,
            transition: 'background 0.2s, transform 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            textTransform: 'uppercase',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
            {role === 'trainer' ? 'Apply as Trainer' : 'Join Waitlist'}
          </a>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="show-mobile"
          aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EEF2EE', padding: 8, borderRadius: 6 }}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{ background: '#0d1a0e', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px 28px' }}>
          {role && (
            <>
              <a href="#how-it-works" onClick={() => setOpen(false)}
                style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.8)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                How It Works
              </a>
              <button onClick={() => { onSwitch(); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.45)', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', padding: '12px 0' }}>
                Switch to {role === 'client' ? 'Trainer' : 'Client'} view
              </button>
            </>
          )}
          <a href="#waitlist" onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '14px', borderRadius: 8 }}>
            {role === 'trainer' ? 'Apply as Trainer' : 'Join Waitlist'}
          </a>
        </div>
      )}

      <style>{`
        .hidden-mobile { display: flex !important; }
        .show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
```

- [ ] **Step 2: Verify**

Run dev server. With role set to `client`:
- Desktop nav shows "How It Works" link + "Switch to Trainer view" button + "Join Waitlist" CTA
- Clicking "Switch to Trainer view" fades to trainer stub and nav updates to "Switch to Client view" + "Apply as Trainer"
- With no role (clear localStorage): nav shows only logo + "Join Waitlist", no switch link

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: update Nav with role-aware switch link

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: SplitHero component

**Files:**
- Modify: `src/App.jsx` — replace `SplitHero` stub

- [ ] **Step 1: Replace the SplitHero stub with the full implementation**

Find the stub `function SplitHero` added in Task 1 and replace it entirely:

```jsx
function SplitHero({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#0d1a0e', position: 'relative' }} className="split-hero-root">
      <style>{`
        .split-hero-root { flex-direction: row; }
        @media (max-width: 768px) { .split-hero-root { flex-direction: column; } }
        .split-hero-root .split-divider { display: block; }
        @media (max-width: 768px) { .split-hero-root .split-divider { display: none; } }
      `}</style>

      {/* Centre divider */}
      <div className="split-divider" style={{ position: 'absolute', top: '12%', bottom: '12%', left: '50%', width: 1, background: 'rgba(255,255,255,0.07)', transform: 'translateX(-50%)', pointerEvents: 'none' }} />

      {/* Client panel */}
      <div
        role="button"
        tabIndex={0}
        aria-label="I'm looking for a trainer"
        onClick={() => onSelect('client')}
        onKeyDown={e => e.key === 'Enter' && onSelect('client')}
        onMouseEnter={() => setHovered('client')}
        onMouseLeave={() => setHovered(null)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 48px',
          cursor: 'pointer',
          outline: 'none',
          opacity: hovered === 'trainer' ? 0.3 : 1,
          background: hovered === 'client' ? 'rgba(45,106,46,0.06)' : 'transparent',
          transition: 'opacity 0.3s ease, background 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 24px' }}>
            Find a Trainer
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 20px' }}>
            Find your trainer.<br /><span style={{ color: '#4ade80' }}>Change your life.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.5)', lineHeight: 1.65, margin: '0 0 36px' }}>
            Browse certified PTs across Singapore.<br />Book instantly, no contracts.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: hovered === 'client' ? '#4ade80' : 'rgba(74,222,128,0.45)', transition: 'color 0.3s ease' }}>
            Get started <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Trainer panel */}
      <div
        role="button"
        tabIndex={0}
        aria-label="I'm a personal trainer"
        onClick={() => onSelect('trainer')}
        onKeyDown={e => e.key === 'Enter' && onSelect('trainer')}
        onMouseEnter={() => setHovered('trainer')}
        onMouseLeave={() => setHovered(null)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '100px 48px',
          cursor: 'pointer',
          outline: 'none',
          opacity: hovered === 'client' ? 0.3 : 1,
          background: hovered === 'trainer' ? 'rgba(45,106,46,0.06)' : 'transparent',
          transition: 'opacity 0.3s ease, background 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 24px' }}>
            I'm a Trainer
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(32px, 5vw, 60px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 20px' }}>
            Your rates.<br />Your schedule.<br /><span style={{ color: '#4ade80' }}>Your clients.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.5)', lineHeight: 1.65, margin: '0 0 36px' }}>
            List for free. Keep 80%.<br />Build your practice on your terms.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: hovered === 'trainer' ? '#4ade80' : 'rgba(74,222,128,0.45)', transition: 'color 0.3s ease' }}>
            Apply now <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.14em', color: 'rgba(238,242,238,0.18)', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        FitnessGuru · Singapore
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Clear localStorage. Reload. Expected:
- Full viewport split, two panels side by side on desktop
- Hovering client panel dims trainer panel to 30% opacity, client panel gets subtle green tint
- Hovering trainer panel does the reverse
- Clicking client panel triggers fade → client stub page
- On mobile (DevTools → 375px): panels stack vertically, client on top

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: implement SplitHero entry point with hover effects

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Update Waitlist to accept defaultRole prop

**Files:**
- Modify: `src/App.jsx` — `Waitlist` function signature + initial state

- [ ] **Step 1: Update Waitlist signature and role initial state**

Find `function Waitlist() {` and change it to:

```jsx
function Waitlist({ defaultRole = 'client' }) {
```

Then find the line inside Waitlist:
```jsx
const [role, setRole] = useState('client')
```

Change it to:
```jsx
const [role, setRole] = useState(defaultRole)
```

- [ ] **Step 2: Verify**

With role set to `trainer` in localStorage, go to trainer stub page. The Waitlist section won't be visible yet (stub doesn't include it), so manually test by temporarily adding `<Waitlist defaultRole="trainer" />` in the TrainerPage stub and confirming the toggle pre-selects "I am a trainer". Revert after confirming.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add defaultRole prop to Waitlist component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: ClientPage — all sections

**Files:**
- Modify: `src/App.jsx` — replace `ClientPage` stub

- [ ] **Step 1: Add client sub-components and replace ClientPage stub**

Find the stub `function ClientPage()` and replace it (and the stub itself) with the following block. Paste all of this in place of the stub:

```jsx
function ClientHero() {
  return (
    <section style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', background: '#0d1a0e', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,106,46,0.28) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 100px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 28px' }}>
          Singapore's Personal Training Marketplace
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(52px, 10vw, 104px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 32px' }}>
          Find your trainer.<br /><span style={{ color: '#4ade80' }}>Change your life.</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(238,242,238,0.6)', maxWidth: 520, lineHeight: 1.65, margin: '0 0 52px' }}>
          Browse certified personal trainers across Singapore. Book instantly.
        </p>
        <a href="#waitlist"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '16px 32px', borderRadius: 10, boxShadow: '0 0 40px rgba(45,106,46,0.35)', transition: 'background 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Find a Trainer <ArrowRight />
        </a>
      </div>
    </section>
  )
}

function ClientProblem() {
  const problems = [
    { label: '01', title: "Generic classes don't work.", body: "Group sessions are built for the average person — not for your goals, your body, or your schedule. One-size-fits-all training delivers one-size-fits-all results." },
    { label: '02', title: "How do you know who's legit?", body: "Anyone can call themselves a personal trainer. Without verified certifications and real reviews, you're guessing — and the wrong trainer wastes time, money, and motivation." },
    { label: '03', title: "Pricing is opaque. Contracts are scary.", body: "Gym packages lock you in. Studio rates are hidden until you're already there. Long-term commitments before you've even tried a session shouldn't be the norm." },
  ]
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(45,106,46,0.07) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>The Problem</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 700 }}>
          Finding the right trainer is harder than it should be.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {problems.map(({ label, title, body }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'rgba(74,222,128,0.4)', margin: '0 0 20px', textTransform: 'uppercase' }}>{label}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: '#EEF2EE', margin: '0 0 16px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientHowItWorks() {
  const steps = [
    { num: '01', title: 'Browse verified trainers', body: 'Filter by specialty, location, and availability. Every trainer is certified and reviewed by real clients.' },
    { num: '02', title: 'Book in minutes', body: 'No back-and-forth emails. No long-term contracts. Pick a time that works, pay securely, show up.' },
    { num: '03', title: 'Train and transform', body: 'Your trainer. Your goals. Your programme. Show up, do the work, see results.' },
  ]
  return (
    <section id="how-it-works" style={{ background: '#0d1a0e', padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>How It Works</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 600 }}>
          Three steps to your first session.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {steps.map(({ num, title, body }, i) => (
            <div key={num} style={{ padding: '48px 36px', background: i === 1 ? 'rgba(45,106,46,0.08)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 64, lineHeight: 1, color: 'rgba(74,222,128,0.1)', letterSpacing: '-0.04em', marginBottom: 24 }}>{num}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 16px' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientValueProps() {
  const items = [
    { title: 'Every trainer is certified and vetted.', body: "We verify every certification before a trainer goes live. You see their qualifications, their reviews, and their training style — before you book." },
    { title: 'Transparent pricing. No surprises.', body: "Every trainer lists their session rate upfront. You know exactly what you're paying before you commit to anything." },
    { title: 'Flexible. No lock-in.', body: "Book sessions one at a time or in blocks. Train at home, in a condo gym, or at a park. No contracts, no minimum commitments." },
  ]
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Why FitnessGuru</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 640 }}>
          Built for people who are serious about results.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(({ title, body }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', marginTop: 2 }}>
                <CheckIcon size={16} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientTestimonials() {
  const testimonials = [
    { quote: "I'd tried three different trainers through my gym and never clicked with any of them. FitnessGuru let me read real reviews and see each trainer's actual style. I found Marcus in a week. Six months later I'm down 14kg.", name: 'Natasha L.', detail: 'Client · Tampines', stars: 5 },
    { quote: "I was nervous to commit without knowing if a trainer would be right for me. The ability to book single sessions first made it so much easier. Priya has been training me through my second pregnancy. I feel stronger than I ever have.", name: 'Divya R.', detail: 'Client · River Valley', stars: 5 },
    { quote: "I always thought personal training was out of my budget. FitnessGuru showed me trainers at every price point, with no hidden fees. I know what I pay. My trainer knows what I need. Best decision I made this year.", name: 'Wei Ming T.', detail: 'Client · Jurong', stars: 5 },
  ]
  return (
    <section style={{ background: '#0d1a0e', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 50% 70% at 20% 50%, rgba(45,106,46,0.07) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Real Stories</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 600 }}>
          Lives changed. In Singapore.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {testimonials.map(({ quote, name, detail, stars }) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 24 }}>
                {Array.from({ length: stars }).map((_, i) => <span key={i} style={{ color: '#4ade80' }}><StarIcon /></span>)}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.65)', lineHeight: 1.75, margin: '0 0 28px', flex: 1 }}>"{quote}"</p>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 4 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientCTA() {
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Get Started</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 28px' }}>
          Your transformation<br />starts with<br /><span style={{ color: '#4ade80' }}>one decision.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'rgba(238,242,238,0.5)', lineHeight: 1.65, margin: '0 0 48px' }}>
          Join the waitlist. Get SGD $20 off your first session when we launch.
        </p>
        <a href="#waitlist"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '18px 40px', borderRadius: 10, boxShadow: '0 0 40px rgba(45,106,46,0.35)', transition: 'background 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Start your search <ArrowRight />
        </a>
      </div>
    </section>
  )
}

function ClientPage() {
  return (
    <>
      <ClientHero />
      <ClientProblem />
      <ClientHowItWorks />
      <ClientValueProps />
      <ClientTestimonials />
      <ClientCTA />
      <Waitlist defaultRole="client" />
    </>
  )
}
```

- [ ] **Step 2: Verify client mode**

Set `fg_role = client` in localStorage or click client panel. Scroll through the full page. Check:
- Hero headline: "Find your trainer. Change your life."
- Problem cards render (3 cards)
- How It Works (3 steps, middle step has green tint)
- Value props (3 rows with check icons)
- Testimonials (3 cards with stars)
- CTA section + Waitlist (toggle pre-set to "I want a trainer")
- Footer renders

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: implement ClientPage with all six sections

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: TrainerPage — all sections

**Files:**
- Modify: `src/App.jsx` — replace `TrainerPage` stub

- [ ] **Step 1: Replace the TrainerPage stub with the full implementation**

Find the stub `function TrainerPage()` and replace it (and the stub) with:

```jsx
function TrainerHero() {
  return (
    <section style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', background: '#0d1a0e', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45,106,46,0.28) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 100px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 28px' }}>
          For Personal Trainers in Singapore
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(52px, 10vw, 104px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 32px' }}>
          Your rates.<br />Your schedule.<br /><span style={{ color: '#4ade80' }}>Your clients.</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(238,242,238,0.6)', maxWidth: 520, lineHeight: 1.65, margin: '0 0 52px' }}>
          Join Singapore's trainer marketplace. List for free. Keep 80%.
        </p>
        <a href="#waitlist"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '16px 32px', borderRadius: 10, boxShadow: '0 0 40px rgba(45,106,46,0.35)', transition: 'background 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Apply as a Trainer <ArrowRight />
        </a>
      </div>
    </section>
  )
}

function TrainerProblem() {
  const problems = [
    { label: '01', title: 'Gyms take half. You do all the work.', body: "The industry standard gym split is 50%. You bring the expertise, the energy, and the results — and hand over half of every session to a facility you don't own." },
    { label: '02', title: "You're building their brand, not yours.", body: "Your clients know the gym's name. They don't follow you when you leave. You have no portable client base, no reputation that's truly yours." },
    { label: '03', title: 'No control. No freedom.', body: "The gym sets your schedule, approves your clients, and caps your rates. You're an employee in everything but name — without the benefits." },
  ]
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(45,106,46,0.07) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>The Problem</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 700 }}>
          The gym model is broken for trainers.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {problems.map(({ label, title, body }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'rgba(74,222,128,0.4)', margin: '0 0 20px', textTransform: 'uppercase' }}>{label}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: '#EEF2EE', margin: '0 0 16px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerHowItWorks() {
  const steps = [
    { num: '01', title: 'Create your profile', body: 'Showcase your certifications, your specialty, your training style, and where you train. Your profile is your brand.' },
    { num: '02', title: 'Set your rates and availability', body: 'Full control. You set the price per session. No platform-imposed tiers, no caps, no minimums. You decide your schedule.' },
    { num: '03', title: 'Get booked, get paid', body: 'Clients book and pay through FitnessGuru. We take 20%. You keep 80%. Paid out automatically after each session.' },
  ]
  return (
    <section id="how-it-works" style={{ background: '#0d1a0e', padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>How It Works</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 600 }}>
          List once. Train on your terms.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2 }}>
          {steps.map(({ num, title, body }, i) => (
            <div key={num} style={{ padding: '48px 36px', background: i === 1 ? 'rgba(45,106,46,0.08)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 64, lineHeight: 1, color: 'rgba(74,222,128,0.1)', letterSpacing: '-0.04em', marginBottom: 24 }}>{num}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 16px' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerValueProps() {
  const items = [
    { title: 'Keep 80% of every session.', body: "The best split in Singapore's fitness industry. Set a rate of $120 per session? You keep $96. Every time. No exceptions, no sliding scale." },
    { title: 'Your rates. No platform interference.', body: "Set any price. Charge what you're worth. FitnessGuru has no imposed tiers, no caps, and no minimums. Increase your rates as your reputation grows." },
    { title: 'Your clients. Your relationships.', body: "We don't own your client relationships. You build your reputation on your profile. When clients follow you, they follow you — not the platform." },
  ]
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Why FitnessGuru</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 640 }}>
          Built for trainers who are done compromising.
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(({ title, body }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', marginTop: 2 }}>
                <CheckIcon size={16} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 12px' }}>{title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerTestimonials() {
  const testimonials = [
    { quote: "I was splitting 50/50 at my gym and working six days a week just to hit my income target. On FitnessGuru I kept 80%, dropped to four days, and made more. That's not marketing — that's my actual numbers.", name: 'Marcus T.', detail: 'Trainer · Tampines', stars: 5 },
    { quote: "The freedom to set my own rates changed everything. I've built a reputation for prenatal training, and my client base followed me when I left my studio. FitnessGuru is my practice now.", name: 'Priya S.', detail: 'Trainer · Orchard', stars: 5 },
    { quote: "I used to lose clients every time a gym changed my schedule or raised their fees. Now my clients book directly through my profile. Three years of relationships, portable and protected.", name: 'Daniel W.', detail: 'Trainer · CBD', stars: 5 },
  ]
  return (
    <section style={{ background: '#0d1a0e', padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 50% 70% at 20% 50%, rgba(45,106,46,0.07) 0%, transparent 70%)' }} aria-hidden="true" />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Trainer Stories</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 600 }}>
          Real trainers. Real earnings.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {testimonials.map(({ quote, name, detail, stars }) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '36px 32px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 24 }}>
                {Array.from({ length: stars }).map((_, i) => <span key={i} style={{ color: '#4ade80' }}><StarIcon /></span>)}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.65)', lineHeight: 1.75, margin: '0 0 28px', flex: 1 }}>"{quote}"</p>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.35)', marginTop: 4 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerCTA() {
  return (
    <section style={{ background: '#0a140b', padding: '100px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Apply Now</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 28px' }}>
          Stop splitting your income<br />with a gym<br /><span style={{ color: '#4ade80' }}>you don't own.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'rgba(238,242,238,0.5)', lineHeight: 1.65, margin: '0 0 48px' }}>
          Join the waitlist. Get 90 days commission-free when we launch.
        </p>
        <a href="#waitlist"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '18px 40px', borderRadius: 10, boxShadow: '0 0 40px rgba(45,106,46,0.35)', transition: 'background 0.2s, transform 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Join as a Trainer <ArrowRight />
        </a>
      </div>
    </section>
  )
}

function TrainerPage() {
  return (
    <>
      <TrainerHero />
      <TrainerProblem />
      <TrainerHowItWorks />
      <TrainerValueProps />
      <TrainerTestimonials />
      <TrainerCTA />
      <Waitlist defaultRole="trainer" />
    </>
  )
}
```

- [ ] **Step 2: Verify trainer mode**

Set localStorage `fg_role = trainer` or click trainer panel from split hero. Scroll through:
- Hero: "Your rates. Your schedule. Your clients."
- Problem: gym takes 50%, brand ownership, no control (3 cards)
- How It Works: profile → rates → get paid (3 steps)
- Value props: 80% split, own rates, own clients
- Testimonials: Marcus, Priya, Daniel trainer stories
- CTA: "Stop splitting your income with a gym you don't own."
- Waitlist pre-set to "I am a trainer"
- Footer renders

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: implement TrainerPage with all six sections

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Remove old sections

**Files:**
- Modify: `src/App.jsx` — delete replaced functions

- [ ] **Step 1: Delete the following functions entirely from `src/App.jsx`**

Remove these function blocks (they are fully replaced by the new role-based pages):
- `function Hero()` (lines ~167–272)
- `function Problem()` (lines ~273–374)
- `function HowItWorks()` (lines ~375–453)
- `function Venues()` (lines ~454–528)
- `function TrainerCard()` (lines ~529–604)
- `function Trainers()` (lines ~605–635)
- `function Pricing()` (lines ~636–757)
- `function ForTrainers()` (lines ~758–861)

Also remove the `trainers` and `avatarColors` data arrays (lines ~48–65) — they are no longer referenced.

- [ ] **Step 2: Verify no compile errors**

```bash
cd /Users/calvintee/FitnessGuru && npm run build
```

Expected: build completes with no errors and no unused variable warnings for the deleted sections.

- [ ] **Step 3: Smoke test all three flows**

1. Clear localStorage → split hero appears, both panels interactive
2. Click client → full client page, scroll all sections, Waitlist pre-set to client
3. Nav "Switch to Trainer view" → fades to trainer page
4. Scroll trainer page, Waitlist pre-set to trainer
5. Nav "Switch to Client view" → fades back to client
6. Hard refresh → stays on client page (localStorage persists)
7. Mobile (375px): split hero stacks vertically, all sections readable

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: remove old single-mode sections, complete role-based journey

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- ✅ Split hero entry point (Task 3)
- ✅ Role persistence via localStorage (Task 1)
- ✅ Skip split hero on return visits (Task 1 — `useState(() => localStorage.getItem('fg_role'))`)
- ✅ Nav switch link (Task 2)
- ✅ Fade transition 280ms (Task 1 — opacity transition on `<main>`)
- ✅ Mobile: split hero stacks vertically (Task 3 — CSS media query)
- ✅ Client mode — all 6 sections (Task 5)
- ✅ Trainer mode — all 6 sections (Task 6)
- ✅ Waitlist pre-set per role (Task 4)
- ✅ Footer only shown when role is set (Task 1)
- ✅ Old sections removed (Task 7)

**No placeholders.** All code blocks are complete and copy-pasteable.

**Type consistency:** `onSelect`, `onSwitch`, `defaultRole` prop names are consistent across all tasks. `selectRole` / `switchRole` helpers defined in Task 1 and referenced correctly in Task 2.
