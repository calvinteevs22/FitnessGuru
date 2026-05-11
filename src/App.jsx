import { useState, useEffect, useRef } from 'react'

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

/* ─── Data ─────────────────────────────────────────────────── */
const trainers = [
  { id: 1, initials: 'SC', name: 'Sarah Chen', specialty: 'Strength & Conditioning', certs: ['NASM-CPT', 'TRX'], rating: 4.9, reviews: 47, rate: 85, areas: 'Bishan · Toa Payoh · AMK', venues: 'Condo Gym · Park', tag: 'Verified' },
  { id: 2, initials: 'MT', name: 'Marcus Tan', specialty: 'Weight Loss & HIIT', certs: ['ACE-CPT', 'Precision Nutrition L1'], rating: 4.8, reviews: 32, rate: 75, areas: 'Tampines · Bedok · Pasir Ris', venues: 'Home · Park · Condo Gym', tag: 'Top Rated' },
  { id: 3, initials: 'PS', name: 'Priya Sharma', specialty: 'Prenatal & Postnatal', certs: ['ACSM-CPT', 'Pre/Postnatal Cert'], rating: 5.0, reviews: 28, rate: 90, areas: 'Orchard · River Valley · Tiong Bahru', venues: 'Home · Studio', tag: 'Specialist' },
  { id: 4, initials: 'JL', name: 'James Lim', specialty: 'Functional & Seniors', certs: ['NASM-CPT', 'Senior Fitness Spec.'], rating: 4.9, reviews: 53, rate: 70, areas: 'Jurong · Clementi · Bukit Batok', venues: 'Community Centre · Home', tag: 'Top Rated' },
  { id: 5, initials: 'AR', name: 'Aisha Rahman', specialty: 'Boxing & Self-Defence', certs: ['ACE-CPT', 'Boxing Coach L2'], rating: 4.7, reviews: 19, rate: 80, areas: 'Woodlands · Yishun · Sembawang', venues: 'Condo Gym · Park', tag: 'Verified' },
  { id: 6, initials: 'DW', name: 'Daniel Wong', specialty: 'Bodybuilding & Hypertrophy', certs: ['NASM-CPT', 'CSCS'], rating: 4.8, reviews: 41, rate: 95, areas: 'CBD · Marina Bay · Tanjong Pagar', venues: 'Condo Gym · Studio', tag: 'Elite' },
]

const avatarColors = [
  { bg: 'rgba(45,106,46,0.18)', text: '#3d8b3e' },
  { bg: 'rgba(37,99,235,0.14)', text: '#3b82f6' },
  { bg: 'rgba(234,88,12,0.14)', text: '#f97316' },
  { bg: 'rgba(139,92,246,0.14)', text: '#a78bfa' },
  { bg: 'rgba(236,72,153,0.14)', text: '#f472b6' },
  { bg: 'rgba(6,182,212,0.14)', text: '#22d3ee' },
]

/* ─── Nav ───────────────────────────────────────────────────── */
function Nav() {
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
          <div style={{
            width: 34, height: 34, borderRadius: 8, background: '#2d6a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '-0.5px' }}>FG</span>
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#EEF2EE', letterSpacing: '0.01em' }}>
            Fitness<span style={{ color: '#4ade80' }}>Guru</span>
          </span>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden-mobile">
          {[['How It Works', '#how-it-works'], ['Trainers', '#trainers'], ['Pricing', '#pricing'], ['For Trainers', '#for-trainers']].map(([label, href]) => (
            <a key={label} href={href} style={{
              fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
              color: 'rgba(238,242,238,0.7)', textDecoration: 'none',
              transition: 'color 0.2s', letterSpacing: '0.01em',
            }}
              onMouseEnter={e => e.target.style.color = '#EEF2EE'}
              onMouseLeave={e => e.target.style.color = 'rgba(238,242,238,0.7)'}>
              {label}
            </a>
          ))}
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
            Join Waitlist
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setOpen(!open)} className="show-mobile"
          aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EEF2EE', padding: 8, borderRadius: 6 }}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: '#0d1a0e', borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '20px 24px 28px',
        }}>
          {[['How It Works', '#how-it-works'], ['Trainers', '#trainers'], ['Pricing', '#pricing'], ['For Trainers', '#for-trainers']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)}
              style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.8)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {label}
            </a>
          ))}
          <a href="#waitlist" onClick={() => setOpen(false)}
            style={{ display: 'block', marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', textDecoration: 'none', background: '#2d6a2e', padding: '14px', borderRadius: 8 }}>
            Join Waitlist
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

/* ─── Hero ──────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{
      background: '#0d1a0e',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '120px 24px 80px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `radial-gradient(ellipse 60% 50% at 70% 40%, rgba(45,106,46,0.14) 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 20% 70%, rgba(45,106,46,0.07) 0%, transparent 60%)`,
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative' }}>
        {/* Label */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: '#4ade80', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Launching in Singapore
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 900,
          fontSize: 'clamp(56px, 10vw, 128px)', lineHeight: 0.92,
          color: '#EEF2EE', margin: '0 0 24px', letterSpacing: '-0.02em',
          textTransform: 'uppercase', maxWidth: 900,
        }}>
          Your trainer.<br />
          <span style={{ color: '#4ade80', fontStyle: 'italic' }}>Their rules.</span><br />
          <span style={{ WebkitTextStroke: '1.5px #4ade80', color: 'transparent' }}>No more.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 'clamp(17px, 2.5vw, 21px)',
          color: 'rgba(238,242,238,0.65)', lineHeight: 1.55, maxWidth: 540,
          margin: '0 0 40px',
        }}>
          Singapore's personal training marketplace. Certified trainers from{' '}
          <strong style={{ color: '#EEF2EE', fontWeight: 600 }}>SGD $65/session</strong>.
          No gym middleman. No lock-in packages. Train anywhere.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <a href="#waitlist" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#fff', textDecoration: 'none',
            background: '#2d6a2e', padding: '16px 32px', borderRadius: 8,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'background 0.2s, transform 0.15s',
            boxShadow: '0 0 40px rgba(45,106,46,0.35)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
            Find a Trainer <ArrowRight />
          </a>
          <a href="#for-trainers" style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'rgba(238,242,238,0.85)', textDecoration: 'none',
            border: '1.5px solid rgba(255,255,255,0.2)', padding: '16px 32px', borderRadius: 8,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'border-color 0.2s, color 0.2s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'; e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(238,242,238,0.85)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            I'm a Trainer
          </a>
        </div>

        {/* Stats row */}
        <div style={{
          marginTop: 64,
          display: 'flex', flexWrap: 'wrap', gap: 0,
          borderTop: '1px solid rgba(255,255,255,0.09)',
          paddingTop: 40,
        }}>
          {[
            { num: '30–50%', label: 'cheaper than gym rates' },
            { num: '80%', label: 'kept by every trainer' },
            { num: '$0', label: 'lock-in packages' },
            { num: '24/7', label: 'booking, no callbacks' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '0 40px 0 0', marginRight: 40,
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.09)' : 'none',
              marginBottom: 16,
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 42px)', color: '#4ade80', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 13, color: 'rgba(238,242,238,0.45)', marginTop: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Problem / Price Breakdown ─────────────────────────────── */
function Problem() {
  return (
    <section style={{ background: '#F4F4F0', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section label */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a2e' }}>The Problem</span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
          fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.01em',
          color: '#0d1a0e', margin: '0 0 56px', maxWidth: 700,
        }}>
          The gym takes half.<br />
          <span style={{ color: '#2d6a2e' }}>You pay the price.</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {/* Gym card */}
          <div style={{
            background: '#fff', borderRadius: 16,
            padding: '36px', border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 28 }}>At a Gym (Fitness First / Virgin Active)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6b7280' }}>You pay</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 42, color: '#111827', letterSpacing: '-0.02em' }}>$150</span>
            </div>
            <div style={{ height: 1, background: '#f3f4f6', margin: '0 0 20px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6b7280' }}>Gym keeps (40–50%)</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#ef4444' }}>−$65</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6b7280' }}>Trainer earns</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#374151' }}>$85</span>
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 16px' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626', fontWeight: 500 }}>The gym does the least — and takes the most.</span>
            </div>
          </div>

          {/* FitnessGuru card */}
          <div style={{
            background: '#0d1a0e', borderRadius: 16,
            padding: '36px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 0 60px rgba(45,106,46,0.2)',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none',
              backgroundImage: 'radial-gradient(ellipse 70% 60% at 100% 0%, rgba(45,106,46,0.18) 0%, transparent 70%)',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80' }}>On FitnessGuru</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(74,222,128,0.12)', color: '#4ade80', padding: '5px 10px', borderRadius: 20 }}>Better for everyone</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.6)' }}>You pay</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 42, color: '#4ade80', letterSpacing: '-0.02em' }}>$85</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 20px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.5)' }}>Platform fee (20%)</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: 'rgba(238,242,238,0.5)' }}>−$17</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.6)' }}>Trainer earns</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#4ade80' }}>$68</span>
              </div>
              <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 8, padding: '12px 16px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.8)', fontWeight: 500 }}>Same trainer. Same expertise. 43% less for you.</span>
              </div>
            </div>
          </div>

          {/* Quote card */}
          <div style={{
            background: '#2d6a2e', borderRadius: 16, padding: '36px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            gridColumn: 'span 1',
          }}>
            <blockquote style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontStyle: 'italic',
              fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.2,
              color: '#fff', margin: '0 0 20px', letterSpacing: '-0.01em',
            }}>
              "The gap between what you pay and what your trainer earns — that's the gym's profit. FitnessGuru closes it."
            </blockquote>
            <div style={{ height: 2, width: 32, background: '#4ade80', borderRadius: 2, marginBottom: 16 }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6 }}>
              14,520 data points confirm Singaporeans are willing to pay SGD $75/session — yet gyms charge $130–200. The gap is the middleman.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ──────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'Browse verified trainer profiles — certifications, reviews, specialisations, real-time availability. Filter by location, training style, and venue type.',
      iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
    {
      num: '02',
      title: 'Book in 60s',
      desc: 'Select a trainer, choose a time slot, pick a venue. Book and pay instantly. Single session or package. No phone calls. No Sunday closures.',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      num: '03',
      title: 'Train & Grow',
      desc: 'Show up and train. Rate your session. Build an ongoing coaching relationship with someone who tracks your history, goals, and progress.',
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    },
  ]

  return (
    <section id="how-it-works" style={{ background: '#0d1a0e', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 64 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80' }}>How It Works</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
              fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.01em',
              color: '#EEF2EE', margin: 0,
            }}>
              From search<br />to session.
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.5)', maxWidth: 320, margin: 0, lineHeight: 1.6 }}>
            Open FitnessGuru at 9pm. Book a 6:30am session at your condo gym. This doesn't exist anywhere else in Singapore today.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
          {steps.map((s, i) => (
            <div key={s.num} style={{
              background: i === 1 ? '#2d6a2e' : 'rgba(255,255,255,0.03)',
              borderRadius: i === 0 ? '16px 0 0 16px' : i === 2 ? '0 16px 16px 0' : 0,
              padding: '44px 40px', border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 72,
                color: i === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(74,222,128,0.12)',
                lineHeight: 1, marginBottom: 24, letterSpacing: '-0.03em',
              }}>{s.num}</div>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: i === 1 ? 'rgba(255,255,255,0.15)' : 'rgba(74,222,128,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, color: i === 1 ? '#fff' : '#4ade80',
              }}>
                <Icon d={s.iconPath} size={22} stroke={1.75} />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28,
                textTransform: 'uppercase', letterSpacing: '0.01em',
                color: '#EEF2EE', margin: '0 0 12px',
              }}>{s.title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: i === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(238,242,238,0.5)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Venues ────────────────────────────────────────────────── */
function Venues() {
  const venues = [
    { label: 'Condo Gym', cost: 'SGD $0', note: '80% of private estates have one — free for residents', iconPath: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11' },
    { label: 'Your Home', cost: 'SGD $0', note: 'Maximum convenience. Trainer brings equipment if needed.', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Public Park', cost: 'SGD $0', note: 'East Coast, Bishan, ActiveSG parks — fully equipped outdoor fitness areas', iconPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { label: 'ActiveSG Gym', cost: 'SGD $2.50', note: 'Government community centre gyms across all HDB estates', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ]

  return (
    <section style={{ background: '#F4F4F0', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="venues-grid">
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a2e' }}>Venue Flexibility</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
              fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.01em',
              color: '#0d1a0e', margin: '0 0 24px',
            }}>
              No gym<br />required.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: '#6b7280', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 420 }}>
              The absence of a mandatory gym venue isn't a limitation — it's a feature. You pay for coaching. Not marble floors and a juice bar.
            </p>
            <a href="#waitlist" style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#fff', textDecoration: 'none',
              background: '#2d6a2e', padding: '14px 28px', borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'background 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3d8b3e'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(0)' }}>
              Book Your Spot <ArrowRight />
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {venues.map((v, i) => (
              <div key={v.label} style={{
                background: '#fff', borderRadius: i === 0 ? '12px 12px 2px 2px' : i === venues.length - 1 ? '2px 2px 12px 12px' : 2,
                padding: '20px 24px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(45,106,46,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a2e', flexShrink: 0 }}>
                  <Icon d={v.iconPath} size={18} stroke={1.5} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{v.label}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, color: '#2d6a2e' }}>{v.cost}</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{v.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .venues-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  )
}

/* ─── Trainer Card ──────────────────────────────────────────── */
function TrainerCard({ trainer, index }) {
  const col = avatarColors[index % avatarColors.length]
  const tagColors = { 'Top Rated': { bg: 'rgba(234,179,8,0.12)', text: '#ca8a04' }, 'Specialist': { bg: 'rgba(139,92,246,0.12)', text: '#7c3aed' }, 'Elite': { bg: 'rgba(239,68,68,0.1)', text: '#dc2626' }, 'Verified': { bg: 'rgba(45,106,46,0.12)', text: '#2d6a2e' } }
  const tag = tagColors[trainer.tag] || tagColors['Verified']

  return (
    <article style={{
      background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #f0f0f0',
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
      {/* Card top */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: col.text }}>{trainer.initials}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.01em', lineHeight: 1.1 }}>{trainer.name}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6b7280', marginTop: 2 }}>{trainer.specialty}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', background: tag.bg, color: tag.text, padding: '4px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>{trainer.tag}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 2, color: '#f59e0b' }}>
          {Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: '#111827' }}>{trainer.rating}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9ca3af' }}>({trainer.reviews} reviews)</span>
      </div>

      {/* Certs */}
      <div style={{ padding: '14px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {trainer.certs.map(c => (
          <span key={c} style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, background: 'rgba(45,106,46,0.08)', color: '#2d6a2e', padding: '4px 10px', borderRadius: 20 }}>{c}</span>
        ))}
      </div>

      {/* Meta */}
      <div style={{ padding: '14px 24px', fontSize: 12, color: '#9ca3af', flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-body)', marginBottom: 4 }}><span style={{ color: '#6b7280', fontWeight: 500 }}>Areas: </span>{trainer.areas}</div>
        <div style={{ fontFamily: 'var(--font-body)' }}><span style={{ color: '#6b7280', fontWeight: 500 }}>Venues: </span>{trainer.venues}</div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 32, color: '#111827', letterSpacing: '-0.02em' }}>${trainer.rate}</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#9ca3af' }}>/session</span>
        </div>
        <a href="#waitlist" style={{
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#fff', textDecoration: 'none',
          background: '#2d6a2e', padding: '10px 20px', borderRadius: 8,
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#3d8b3e'}
          onMouseLeave={e => e.currentTarget.style.background = '#2d6a2e'}>
          Book
        </a>
      </div>
    </article>
  )
}

/* ─── Trainers section ──────────────────────────────────────── */
function Trainers() {
  return (
    <section id="trainers" style={{ background: '#F4F4F0', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 48 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a2e' }}>Our Trainers</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
              fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.01em',
              color: '#0d1a0e', margin: 0,
            }}>
              Certified.<br />Insured. Real.
            </h2>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6b7280', maxWidth: 300, margin: 0, lineHeight: 1.65 }}>
            Every trainer is certified (NASM / ACE / ACSM), insured, and reviewed by verified clients. Quality is guaranteed, not aspirational.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {trainers.map((t, i) => <TrainerCard key={t.id} trainer={t} index={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ───────────────────────────────────────────────── */
function Pricing() {
  const tiers = [
    {
      label: 'Foundation',
      price: '$65',
      sub: 'Newer certified trainers building their practice',
      features: ['Certified NASM / ACE / ACSM', 'Insured', 'Real verified reviews', 'Single session booking', 'All venue types'],
      dark: false, highlight: false,
    },
    {
      label: 'Standard',
      price: '$85',
      sub: 'Experienced trainers with specialist skills',
      features: ['Everything in Foundation', '3–7 years experience', 'Specialist skills (prenatal, seniors...)', 'Programme design included', 'Progress tracking'],
      dark: true, highlight: true,
    },
    {
      label: 'Elite',
      price: '$100+',
      sub: 'Competition coaches and rehab specialists',
      features: ['Everything in Standard', '7+ years experience', 'Advanced certs (CSCS, CHEK...)', 'Fully customised programming', 'Still 30–50% less than gyms'],
      dark: false, highlight: false,
    },
  ]

  return (
    <section id="pricing" style={{ background: '#0d1a0e', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80' }}>Transparent Pricing</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
            fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.95, letterSpacing: '-0.01em',
            color: '#EEF2EE', margin: '0 auto 16px',
          }}>
            What you see<br />is what you pay.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.5)', maxWidth: 420, margin: '0 auto' }}>
            No hidden fees. No lock-in packages. No hard-sell. FitnessGuru takes 20% — that's it.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {tiers.map((t) => (
            <div key={t.label} style={{
              background: t.dark ? '#2d6a2e' : 'rgba(255,255,255,0.04)',
              borderRadius: 16, padding: '40px 32px',
              border: t.highlight ? 'none' : '1px solid rgba(255,255,255,0.07)',
              position: 'relative',
              boxShadow: t.dark ? '0 0 60px rgba(45,106,46,0.3)' : 'none',
            }}>
              {t.highlight && (
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#0d1a0e', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: '0 0 8px 8px' }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: t.dark ? 'rgba(255,255,255,0.7)' : '#4ade80', marginBottom: 16 }}>{t.label}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 56, color: '#EEF2EE', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>{t.price}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: t.dark ? 'rgba(255,255,255,0.65)' : 'rgba(238,242,238,0.45)', marginBottom: 28, lineHeight: 1.5 }}>{t.sub}</div>
              <div style={{ height: 1, background: t.dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)', marginBottom: 24 }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {t.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'var(--font-body)', fontSize: 14, color: t.dark ? 'rgba(255,255,255,0.85)' : 'rgba(238,242,238,0.6)', lineHeight: 1.4 }}>
                    <span style={{ color: t.dark ? '#fff' : '#4ade80', flexShrink: 0, marginTop: 2 }}><CheckIcon size={16} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#waitlist" style={{
                display: 'block', textAlign: 'center',
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: t.dark ? '#2d6a2e' : '#EEF2EE', textDecoration: 'none',
                background: t.dark ? '#EEF2EE' : 'rgba(255,255,255,0.08)',
                padding: '13px 24px', borderRadius: 8,
                transition: 'background 0.2s, color 0.2s',
                border: t.dark ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = t.dark ? '#fff' : 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.background = t.dark ? '#EEF2EE' : 'rgba(255,255,255,0.08)' }}>
                Join Waitlist
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── For Trainers ──────────────────────────────────────────── */
function ForTrainers() {
  return (
    <section id="for-trainers" style={{ background: '#F4F4F0', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="trainers-split">
          {/* Left */}
          <div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2d6a2e' }}>For Trainers</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase',
              fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.01em',
              color: '#0d1a0e', margin: '0 0 24px',
            }}>
              Keep 80%.<br />
              <span style={{ color: '#2d6a2e' }}>Own your<br />practice.</span>
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: '#6b7280', lineHeight: 1.65, margin: '0 0 36px', maxWidth: 420 }}>
              Stop building someone else's business. Set your own rates, own your client relationships, and grow your practice on your terms.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
              {[
                'Keep 80% of every session fee',
                'Set your own rates and schedule',
                'Own your client relationships — forever',
                'Get discovered by clients you\'d never reach',
                'Zero commission for your first 90 days',
                'Professional profile setup included',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(45,106,46,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d6a2e', flexShrink: 0, marginTop: 2 }}>
                    <CheckIcon size={13} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#374151', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            <a href="#waitlist" style={{
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#fff', textDecoration: 'none',
              background: '#0d1a0e', padding: '15px 30px', borderRadius: 8,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              transition: 'background 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2d6a2e'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0d1a0e'; e.currentTarget.style.transform = 'translateY(0)' }}>
              Apply as a Trainer <ArrowRight />
            </a>
          </div>

          {/* Right: Earnings card */}
          <div style={{ background: '#0d1a0e', borderRadius: 20, padding: '40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(ellipse 60% 50% at 100% 0%, rgba(45,106,46,0.2) 0%, transparent 70%)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80', marginBottom: 28 }}>Earnings Comparison</div>

              {[
                { label: 'At a gym — client pays $150', earn: '$75–90', pct: 55, bright: false },
                { label: 'On FitnessGuru — client pays $100', earn: '$80', pct: 80, bright: true },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.55)' }}>{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: row.bright ? '#4ade80' : '#EEF2EE' }}>You earn {row.earn}</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.bright ? '#4ade80' : 'rgba(255,255,255,0.25)', borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '8px 0 28px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { num: '80%', label: 'You keep' },
                  { num: '0', label: 'Commission (first 90 days)' },
                  { num: '24h', label: 'Payment payout' },
                  { num: '∞', label: 'Client ownership' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '18px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, color: '#4ade80', letterSpacing: '-0.02em' }}>{s.num}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.45)', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .trainers-split { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  )
}

/* ─── Waitlist ──────────────────────────────────────────────── */
function Waitlist() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('client')
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
export default function App() {
  return (
    <>
      <a href="#main-content"
        style={{
          position: 'absolute', top: -40, left: 0, background: '#2d6a2e', color: '#fff',
          padding: '8px 16px', zIndex: 9999, fontFamily: 'var(--font-body)', fontSize: 14,
          textDecoration: 'none', borderRadius: '0 0 8px 0',
          transition: 'top 0.2s',
        }}
        onFocus={e => e.target.style.top = '0'}
        onBlur={e => e.target.style.top = '-40px'}>
        Skip to main content
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
        <Problem />
        <HowItWorks />
        <Venues />
        <Trainers />
        <Pricing />
        <ForTrainers />
        <Waitlist />
      </main>
      <Footer />
    </>
  )
}
