import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterTrainerPage from './pages/RegisterTrainerPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import ProfileSetupPage from './pages/ProfileSetupPage.jsx'
import TrainerDashboardPage from './pages/TrainerDashboardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

/* ─── Icon primitives ──────────────────────────────────────── */
const Icon = ({ d, size = 24, stroke = 2, className = '', viewBox = '0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d={d} />
  </svg>
)

const CheckIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">
    <path d="M4 10l4 4 8-8" />
  </svg>
)

const StarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const ArrowRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const MenuIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
)

const CloseIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

/* ─── Nav ───────────────────────────────────────────────────── */
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

/* ─── Waitlist ──────────────────────────────────────────────── */
function Waitlist({ defaultRole = 'client' }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 800)
  }

  return (
    <section id="waitlist" style={{ background: '#0d1a0e', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,106,46,0.12) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80' }}>Early Access</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
          fontSize: 'clamp(40px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em',
          color: '#EEF2EE', margin: '0 0 20px',
        }}>
          Join the<br />
          <span style={{ color: '#4ade80' }}>waitlist.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.5)', margin: '0 0 44px', lineHeight: 1.6 }}>
          Be first to know when FitnessGuru launches in Singapore. Clients get SGD $20 off their first session. Trainers get 90 days commission-free.
        </p>

        {submitted ? (
          <div style={{ background: 'rgba(45,106,46,0.15)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 16, padding: '48px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#4ade80' }}>
              <CheckIcon size={28} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', color: '#EEF2EE', margin: '0 0 12px', letterSpacing: '0.01em' }}>You're on the list.</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.55)', margin: 0, lineHeight: 1.6 }}>
              {role === 'trainer' ? 'Expect a personal email from our founder. Welcome to the team.' : 'We\'ll reach out the moment we launch. Get ready for affordable personal training.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-label="Waitlist signup">
            {/* Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
              {[['client', 'I want a trainer'], ['trainer', 'I am a trainer']].map(([val, lbl]) => (
                <button key={val} type="button"
                  onClick={() => setRole(val)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    background: role === val ? '#2d6a2e' : 'transparent',
                    color: role === val ? '#fff' : 'rgba(238,242,238,0.45)',
                    transition: 'background 0.2s, color 0.2s',
                  }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Email */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                ref={inputRef} type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                aria-label="Email address"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '16px 20px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16,
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? '#1a4a1b' : '#2d6a2e',
                color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'background 0.2s, transform 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 0 32px rgba(45,106,46,0.3)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3d8b3e' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2d6a2e' }}>
              {loading ? (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <>{role === 'trainer' ? 'Apply as a Trainer' : 'Join the Waitlist'} <ArrowRight size={16} /></>
              )}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.3)', marginTop: 12 }}>No spam. Just a launch notification and your early access offer.</p>
          </form>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#080f09', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="#" aria-label="FitnessGuru home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: '#2d6a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 12, color: '#fff' }}>FG</span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#EEF2EE', letterSpacing: '0.01em' }}>
            Fitness<span style={{ color: '#4ade80' }}>Guru</span>
          </span>
        </a>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.3)', margin: 0, textAlign: 'center' }}>
          &copy; 2026 FitnessGuru Pte Ltd &middot; Singapore &middot; Confidential
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(74,222,128,0.5)', margin: 0 }}>
          Cut out the middleman.
        </p>
      </div>
    </footer>
  )
}

/* ─── App ───────────────────────────────────────────────────── */
function SplitHero({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  const clientBenefits = ['Certified & vetted trainers', 'Transparent pricing, no lock-in', 'Book in minutes, train tomorrow']
  const trainerBenefits = ['Keep 80% of every session', 'Set your own rates & schedule', 'Your clients, your brand']

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative', overflow: 'hidden' }} className="split-hero-root">
      <style>{`
        .split-hero-root { flex-direction: row; }
        @media (max-width: 768px) { .split-hero-root { flex-direction: column; } }
        .split-panel { outline: none; }
        .split-panel:focus-visible { box-shadow: inset 0 0 0 3px rgba(255,255,255,0.3); }
        @keyframes splitPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ── Client panel ── */}
      <div
        className="split-panel"
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
          position: 'relative',
          background: 'linear-gradient(160deg, #071a0b 0%, #0d2418 50%, #071a0b 100%)',
          transition: 'opacity 0.45s ease, filter 0.45s ease',
          opacity: hovered === 'trainer' ? 0.18 : 1,
          filter: hovered === 'trainer' ? 'brightness(0.5) saturate(0.4)' : 'brightness(1) saturate(1)',
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(74,222,128,0.14) 0%, transparent 70%)',
          opacity: hovered === 'client' ? 1 : 0.55,
          transition: 'opacity 0.45s ease',
        }} />
        {/* Subtle grain texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '180px',
        }} />
        {/* Hover border */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: hovered === 'client' ? 'inset 0 0 0 1.5px rgba(74,222,128,0.25)' : 'inset 0 0 0 1px rgba(74,222,128,0)',
          transition: 'box-shadow 0.4s ease',
        }} />

        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.28)',
            borderRadius: 100, padding: '7px 18px', marginBottom: 36,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'block', flexShrink: 0, boxShadow: '0 0 8px #4ade80' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4ade80' }}>Find a Trainer</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
            fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.025em',
            color: '#EEF2EE', margin: '0 0 24px',
          }}>
            Find your<br />trainer.<br /><span style={{ color: '#4ade80' }}>Change your<br />life.</span>
          </h2>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.48)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Browse certified PTs across Singapore.<br />Book instantly, no contracts.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40, textAlign: 'left' }}>
            {clientBenefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={10} />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.55)' }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#4ade80', color: '#071a0b', borderRadius: 8,
            padding: '14px 28px', fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            boxShadow: hovered === 'client' ? '0 0 32px rgba(74,222,128,0.4)' : '0 0 0px rgba(74,222,128,0)',
            transform: hovered === 'client' ? 'translateY(-3px)' : 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}>
            Get Started <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: '50%',
        width: 1, transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, transparent 5%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, transparent 95%)',
      }} className="split-divider-line">
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 8, height: 8, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          boxShadow: '0 0 12px rgba(255,255,255,0.15)',
          animation: 'splitPulse 3s ease-in-out infinite',
        }} />
      </div>

      {/* ── Trainer panel ── */}
      <div
        className="split-panel"
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
          position: 'relative',
          background: 'linear-gradient(160deg, #0c0b0a 0%, #181410 50%, #0c0b0a 100%)',
          transition: 'opacity 0.45s ease, filter 0.45s ease',
          opacity: hovered === 'client' ? 0.18 : 1,
          filter: hovered === 'client' ? 'brightness(0.5) saturate(0.4)' : 'brightness(1) saturate(1)',
        }}
      >
        {/* Radial glow — amber */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(251,191,36,0.11) 0%, transparent 70%)',
          opacity: hovered === 'trainer' ? 1 : 0.5,
          transition: 'opacity 0.45s ease',
        }} />
        {/* Subtle grain */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '180px',
        }} />
        {/* Hover border */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          boxShadow: hovered === 'trainer' ? 'inset 0 0 0 1.5px rgba(251,191,36,0.3)' : 'inset 0 0 0 1px rgba(251,191,36,0)',
          transition: 'box-shadow 0.4s ease',
        }} />

        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Pill badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.28)',
            borderRadius: 100, padding: '7px 18px', marginBottom: 36,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', display: 'block', flexShrink: 0, boxShadow: '0 0 8px #fbbf24' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fbbf24' }}>I'm a Trainer</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
            fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.025em',
            color: '#EEF2EE', margin: '0 0 24px',
          }}>
            Your rates.<br />Your schedule.<br /><span style={{ color: '#fbbf24' }}>Your clients.</span>
          </h2>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.48)', lineHeight: 1.7, margin: '0 0 32px' }}>
            List for free. Keep 80%.<br />Build your practice on your terms.
          </p>

          {/* Benefits */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40, textAlign: 'left' }}>
            {trainerBenefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fbbf24' }}>
                  <CheckIcon size={10} />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.55)' }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#fbbf24', color: '#0c0b0a', borderRadius: 8,
            padding: '14px 28px', fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            boxShadow: hovered === 'trainer' ? '0 0 32px rgba(251,191,36,0.4)' : '0 0 0px rgba(251,191,36,0)',
            transform: hovered === 'trainer' ? 'translateY(-3px)' : 'translateY(0)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}>
            Apply Now <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.14em', color: 'rgba(238,242,238,0.15)', textTransform: 'uppercase',
        pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
      }}>
        FitnessGuru · Singapore
      </div>
    </div>
  )
}

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
          {items.map(({ title, body }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
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

function TrainerHero({ onApply = () => {} }) {
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
        <button
          onClick={onApply}
          style={{
            background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6,
            padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
          Apply as a Trainer <ArrowRight size={16} />
        </button>
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
          {items.map(({ title, body }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '40px 36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
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

function TrainerCTA({ onApply = () => {} }) {
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
        <button
          onClick={onApply}
          style={{
            background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6,
            padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
          Apply as a Trainer <ArrowRight size={16} />
        </button>
      </div>
    </section>
  )
}

function TrainerPage({ onApply = () => {} }) {
  return (
    <>
      <TrainerHero onApply={onApply} />
      <TrainerProblem />
      <TrainerHowItWorks />
      <TrainerValueProps />
      <TrainerTestimonials />
      <TrainerCTA onApply={onApply} />
      <Waitlist defaultRole="trainer" />
    </>
  )
}

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
