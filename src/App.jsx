import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupEntryPage from './pages/SignupEntryPage.jsx'
import ClientSignupPage from './pages/ClientSignupPage.jsx'
import ClientProfileSetupPage from './pages/ClientProfileSetupPage.jsx'
import RegisterTrainerPage from './pages/RegisterTrainerPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import ProfileSetupPage from './pages/ProfileSetupPage.jsx'
import TrainerDashboardPage from './pages/TrainerDashboardPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import TrainerListingPage from './pages/TrainerListingPage.jsx'
import TrainerProfilePage from './pages/TrainerProfilePage.jsx'
import BookingConfirmedPage from './pages/BookingConfirmedPage.jsx'
import ClientDashboardPage from './pages/ClientDashboardPage.jsx'

/* ─── Mock trainer roster ────────────────────────────────────── */
const TRAINERS = [
  {
    id: 1, name: 'Marcus Tan', initials: 'MT',
    avatarBg: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
    specialty: 'Strength & Conditioning',
    tags: ['Powerlifting', 'Muscle Gain', 'Athletic Performance'],
    goals: ['Build muscle', 'Improve sports performance'],
    areas: 'Tampines · Bedok · Pasir Ris',
    regions: ['East'],
    rate: 120, rating: 4.9, reviews: 47,
    bio: 'Ex-national powerlifter with 8 years coaching functional strength. Builds real results for athletes and everyday people alike.',
    badge: 'Top Rated', badgeColor: '#4ade80', badgeBg: 'rgba(74,222,128,0.12)',
  },
  {
    id: 2, name: 'Priya Shankar', initials: 'PS',
    avatarBg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    specialty: 'Pre & Postnatal Fitness',
    tags: ['Prenatal', 'Postnatal', "Women's Health"],
    goals: ['Train through pregnancy'],
    areas: 'Orchard · River Valley · Buona Vista',
    regions: ['Central', 'West'],
    rate: 110, rating: 5.0, reviews: 31,
    bio: 'Certified pre/postnatal specialist. Helped 200+ mothers stay strong, safe, and confident through every trimester.',
    badge: 'Specialist', badgeColor: '#c084fc', badgeBg: 'rgba(192,132,252,0.12)',
  },
  {
    id: 3, name: 'Daniel Wong', initials: 'DW',
    avatarBg: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
    specialty: 'HIIT & Fat Loss',
    tags: ['Weight Loss', 'HIIT', 'Metabolic Training'],
    goals: ['Lose weight', 'Just start somewhere'],
    areas: 'CBD · Marina Bay · Raffles Place',
    regions: ['Central'],
    rate: 100, rating: 4.8, reviews: 62,
    bio: 'Former competitive runner. Science-backed fat loss coaching that produces sustainable results — not quick fixes.',
    badge: null, badgeColor: null, badgeBg: null,
  },
  {
    id: 4, name: 'Sarah Lim', initials: 'SL',
    avatarBg: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
    specialty: 'Yoga & Mobility',
    tags: ['Yoga', 'Flexibility', 'Stress Relief'],
    goals: ['Just start somewhere'],
    areas: 'Bishan · Ang Mo Kio · Thomson',
    regions: ['Central', 'North-East'],
    rate: 95, rating: 4.9, reviews: 28,
    bio: 'RYT-500 certified. Blends movement science with traditional yoga practice for lasting, functional flexibility.',
    badge: null, badgeColor: null, badgeBg: null,
  },
  {
    id: 5, name: 'Ryan Koh', initials: 'RK',
    avatarBg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
    specialty: 'Sports Performance',
    tags: ['Speed & Agility', 'Recovery', 'Injury Prevention'],
    goals: ['Improve sports performance', 'Build muscle'],
    areas: 'Jurong · Clementi · West Coast',
    regions: ['West'],
    rate: 130, rating: 4.9, reviews: 19,
    bio: 'S&C coach for national youth athletes. Delivers measurable performance gains at every competitive level.',
    badge: 'Expert', badgeColor: '#fb923c', badgeBg: 'rgba(251,146,60,0.12)',
  },
  {
    id: 6, name: 'Amira Hassan', initials: 'AH',
    avatarBg: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
    specialty: 'Pilates & Core Strength',
    tags: ['Pilates', 'Core & Posture', 'Back Rehab'],
    goals: ['Just start somewhere', 'Improve sports performance'],
    areas: 'Novena · Toa Payoh · Central',
    regions: ['Central'],
    rate: 115, rating: 5.0, reviews: 22,
    bio: 'STOTT PILATES certified. Transforms posture, resolves chronic back pain, and builds the kind of core strength that lasts.',
    badge: null, badgeColor: null, badgeBg: null,
  },
]

/* ─── Icons ──────────────────────────────────────────────────── */
const CheckIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10l4 4 8-8" />
  </svg>
)

const StarIcon = ({ size = 13, color = '#4ade80', filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'} stroke={filled ? 'none' : color} strokeWidth={1.5} aria-hidden="true">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const ArrowRight = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const LocationPin = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

const VerifiedBadge = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
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

/* ─── useScrollReveal ────────────────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ─── TrainerMiniCard (hero preview) ────────────────────────── */
function TrainerMiniCard({ trainer, delay = 0 }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.055)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 14,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      animation: `fadeSlideUp 0.6s ease ${delay}s both`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, flexShrink: 0,
        background: trainer.avatarBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: '#fff',
      }}>
        {trainer.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{trainer.name}</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'rgba(238,242,238,0.48)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trainer.specialty}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, color: '#EEF2EE', letterSpacing: '-0.01em' }}>${trainer.rate}<span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 10, color: 'rgba(238,242,238,0.35)', marginLeft: 2 }}>/hr</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 1 }}>
          <StarIcon size={11} color="#4ade80" filled />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.4)' }}>{trainer.rating}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── TrainerCard (marketplace card) ────────────────────────── */
function TrainerCard({ trainer, onJoin }) {
  const [hov, setHov] = useState(false)
  const { name, initials, avatarBg, specialty, tags, areas, rate, rating, reviews, bio, badge, badgeColor, badgeBg } = trainer

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.035)',
        border: `1px solid ${hov ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 22,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hov ? 'translateY(-7px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hov ? '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(74,222,128,0.15), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        cursor: 'default',
      }}
    >
      {/* Card header gradient */}
      <div style={{
        background: avatarBg,
        padding: '24px 22px 20px',
        position: 'relative',
        minHeight: 96,
        display: 'flex', alignItems: 'flex-end', gap: 14,
      }}>
        {/* Noise overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.07,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '140px',
        }} />
        {/* Avatar */}
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: 'rgba(255,255,255,0.22)',
          border: hov ? '2px solid rgba(74,222,128,0.6)' : '1.5px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19, color: '#fff',
          position: 'relative',
          boxShadow: hov ? '0 0 0 4px rgba(74,222,128,0.12), 0 0 20px rgba(74,222,128,0.25)' : 'none',
          transition: 'all 0.3s ease',
        }}>
          {initials}
        </div>
        {/* Verified icon */}
        <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 2 }}>
          <VerifiedBadge size={14} />
        </div>
        {/* Badge */}
        {badge && (
          <div style={{
            position: 'absolute', top: 14, right: 14,
            background: badgeBg, border: `1px solid ${badgeColor}55`,
            borderRadius: 100, padding: '4px 10px',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeColor,
          }}>
            {badge}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '18px 22px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {/* Name + specialty */}
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 17, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.5, color: '#4ade80', marginTop: 2 }}>{specialty}</div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {tags.map(t => (
            <span key={t} style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500,
              color: 'rgba(238,242,238,0.45)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 100, padding: '3px 9px',
            }}>{t}</span>
          ))}
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(238,242,238,0.38)' }}>
          <LocationPin size={12} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, lineHeight: 1.4 }}>{areas}</span>
        </div>

        {/* Rate + Rating row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 24, color: '#EEF2EE', letterSpacing: '-0.025em' }}>${rate}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.35)', marginLeft: 4 }}>/session</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} size={11} color={i < Math.round(rating) ? '#4ade80' : 'rgba(238,242,238,0.12)'} filled={i < Math.round(rating)} />
              ))}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, color: 'rgba(238,242,238,0.45)' }}>
              {rating} <span style={{ color: 'rgba(238,242,238,0.28)' }}>({reviews})</span>
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Bio */}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.42)', lineHeight: 1.65, margin: 0, flex: 1 }}>
          {bio}
        </p>

        {/* CTA */}
        <button
          onClick={onJoin}
          style={{
            width: '100%', padding: '12px 16px', marginTop: 6,
            background: hov ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'rgba(74,222,128,0.07)',
            color: hov ? '#071a0b' : '#4ade80',
            border: `1px solid ${hov ? 'transparent' : 'rgba(74,222,128,0.2)'}`,
            borderRadius: 11, cursor: 'pointer',
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: hov ? '0 0 24px rgba(74,222,128,0.4), 0 4px 12px rgba(0,0,0,0.3)' : 'none',
          }}>
          Reserve this trainer <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─── ReadyPTLogo ────────────────────────────────────────────────────── */
function ReadyPTLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 40, height: 40 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: '#1a3320',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 900,
            fontSize: 26, color: '#fff', lineHeight: 1, paddingLeft: 2,
          }}>R</span>
        </div>
        <div style={{
          position: 'absolute', top: -4, right: -6,
          background: '#2d6a2e', borderRadius: 4,
          padding: '1px 5px',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 9, color: '#fff', letterSpacing: '0.05em',
          }}>PT</span>
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--font-heading)', fontWeight: 700,
        fontSize: 20, color: '#EEF2EE', letterSpacing: '-0.01em',
      }}>
        Ready<span style={{ color: '#4ade80' }}>PT</span>
      </span>
    </div>
  )
}

/* ─── Nav ────────────────────────────────────────────────────── */
function Nav({ role, onSwitch }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { session, profile, signOut } = useAuth()
  const isLoggedIn = !!session
  const authRole = profile?.role ?? null
  const isTrainer = role === 'trainer'
  const accent = isTrainer ? '#fbbf24' : '#4ade80'
  const navBg = scrolled
    ? isTrainer ? 'rgba(20,16,6,0.96)' : 'rgba(13,26,14,0.96)'
    : 'transparent'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg, backdropFilter: scrolled ? 'blur(16px)' : 'none',
      boxShadow: scrolled ? '0 1px 0 rgba(255,255,255,0.05)' : 'none',
      transition: 'background 0.3s, box-shadow 0.3s',
    }}>
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <a href="#" aria-label="ReadyPT home" style={{ textDecoration: 'none' }}>
          <ReadyPTLogo />
        </a>

        {/* Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="nav-desktop">
          {role && (
            <>
              <a href="#how-it-works" style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#EEF2EE'} onMouseLeave={e => e.target.style.color = 'rgba(238,242,238,0.6)'}>
                How It Works
              </a>
              <button onClick={onSwitch}
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: 'rgba(238,242,238,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = accent} onMouseLeave={e => e.target.style.color = 'rgba(238,242,238,0.4)'}>
                {isTrainer ? 'For Clients' : 'For Trainers'}
              </button>
            </>
          )}
{role && (
            <>
          {isLoggedIn ? (
            <>
              <a href={authRole === 'admin' ? '/admin' : authRole === 'trainer' ? '/dashboard/trainer' : '/signup/client/profile'} style={{
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                color: 'rgba(238,242,238,0.6)', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}>
                Dashboard
              </a>
              <button onClick={() => signOut()} style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14,
                color: 'rgba(238,242,238,0.7)', background: 'none',
                border: '1px solid rgba(238,242,238,0.2)', borderRadius: 8,
                padding: '10px 22px', cursor: 'pointer', letterSpacing: '0.05em',
                textTransform: 'uppercase', transition: 'border-color 0.2s, color 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(238,242,238,0.5)'; e.currentTarget.style.color = '#EEF2EE' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(238,242,238,0.2)'; e.currentTarget.style.color = 'rgba(238,242,238,0.7)' }}>
                Sign out
              </button>
            </>
          ) : (
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
          )}
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="nav-mobile" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EEF2EE', padding: 8, borderRadius: 6 }}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{ background: isTrainer ? '#141008' : '#0d1a0e', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px 28px' }}>
          {role && (
            <>
              <a href="#how-it-works" onClick={() => setOpen(false)}
                style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                How It Works
              </a>
              <button onClick={() => { onSwitch(); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.4)', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', padding: '12px 0' }}>
                {isTrainer ? 'For Clients' : 'For Trainers'}
              </button>
            </>
          )}
{role && (
            <>
          {isLoggedIn ? (
            <>
              <a href={authRole === 'admin' ? '/admin' : authRole === 'trainer' ? '/dashboard/trainer' : '/signup/client/profile'} onClick={() => setOpen(false)}
                style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.75)', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                Dashboard
              </a>
              <button onClick={() => { signOut(); setOpen(false) }}
                style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: 'rgba(238,242,238,0.5)', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', padding: '12px 0' }}>
                Sign out
              </button>
            </>
          ) : (
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
          )}
            </>
          )}
        </div>
      )}

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-mobile { display: none !important; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes splitPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes logo-pulse { 0%,100%{box-shadow:0 0 14px rgba(74,222,128,0.45)} 50%{box-shadow:0 0 28px rgba(74,222,128,0.8)} }
        @keyframes card-shine { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(300%) skewX(-15deg)} }
        @keyframes btn-glow-green { 0%,100%{box-shadow:0 0 28px rgba(74,222,128,0.38),0 4px 20px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 60px rgba(74,222,128,0.72),0 4px 20px rgba(0,0,0,0.4)} }
        @keyframes btn-glow-amber { 0%,100%{box-shadow:0 0 28px rgba(251,191,36,0.38),0 4px 20px rgba(0,0,0,0.4)} 50%{box-shadow:0 0 60px rgba(251,191,36,0.72),0 4px 20px rgba(0,0,0,0.4)} }
        @keyframes orb-float { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-32px) scale(1.06)} }
        @keyframes orb-float-2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(18px,-24px) scale(1.04)} 66%{transform:translate(-12px,14px) scale(0.96)} }
        @keyframes orb-float-3 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-22px,-18px) scale(1.07)} 75%{transform:translate(16px,8px) scale(0.95)} }
      `}</style>
    </header>
  )
}

/* ─── SplitHero ──────────────────────────────────────────────── */
function SplitHero({ onSelect }) {
  const [hovered, setHovered] = useState(null)
  const clientBenefits = ['Certified & vetted trainers', 'Transparent pricing, no lock-in', 'Book in minutes, train tomorrow']
  const trainerBenefits = ['Keep 80% of every session', 'Set your own rates & schedule', 'Your clients, your brand']

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative', overflow: 'hidden' }} className="split-root">
      <style>{`
        .split-root { flex-direction: row; }
        @media(max-width:768px){.split-root{flex-direction:column;} .split-divider{display:none!important;}}
        .split-panel:focus-visible{box-shadow:inset 0 0 0 3px rgba(255,255,255,0.28);}
      `}</style>

      {/* Client panel */}
      <div className="split-panel" role="button" tabIndex={0}
        aria-label="I'm looking for a trainer"
        onClick={() => onSelect('client')}
        onKeyDown={e => e.key === 'Enter' && onSelect('client')}
        onMouseEnter={() => setHovered('client')} onMouseLeave={() => setHovered(null)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '100px 48px', cursor: 'pointer', position: 'relative',
          background: 'linear-gradient(160deg, #071a0b 0%, #0d2418 50%, #071a0b 100%)',
          opacity: hovered === 'trainer' ? 0.15 : 1,
          filter: hovered === 'trainer' ? 'brightness(0.45) saturate(0.3)' : 'brightness(1)',
          transition: 'opacity 0.45s ease, filter 0.45s ease',
        }}>
        {/* Animated orbs */}
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.13) 0%, transparent 70%)', top: '10%', left: '15%', pointerEvents: 'none', animation: 'orb-float 8s ease-in-out infinite', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 70%)', bottom: '15%', right: '10%', pointerEvents: 'none', animation: 'orb-float-2 11s ease-in-out infinite 2s', filter: 'blur(1px)' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 70%)', top: '55%', left: '5%', pointerEvents: 'none', animation: 'orb-float-3 14s ease-in-out infinite 4s' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(74,222,128,0.1) 0%, transparent 70%)', opacity: hovered === 'client' ? 1 : 0.5, transition: 'opacity 0.4s' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: hovered === 'client' ? 'inset 0 0 0 1.5px rgba(74,222,128,0.35)' : 'none', transition: 'box-shadow 0.4s' }} />

        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.28)', borderRadius: 100, padding: '7px 18px', marginBottom: 36 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 8px #4ade80', display: 'block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4ade80' }}>Find a Trainer</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.025em', color: '#EEF2EE', margin: '0 0 24px' }}>
            Find your<br />trainer.<br /><span style={{ color: '#4ade80' }}>Change your<br />life.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.46)', lineHeight: 1.7, margin: '0 0 32px' }}>
            Browse certified PTs across Singapore.<br />Book instantly, no contracts.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40, textAlign: 'left' }}>
            {clientBenefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#4ade80' }}>
                  <CheckIcon size={10} />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.52)' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
            color: '#071a0b', borderRadius: 11,
            padding: '15px 30px', fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            animation: hovered === 'client' ? 'btn-glow-green 2s ease-in-out infinite' : 'none',
            boxShadow: hovered === 'client' ? '0 0 48px rgba(74,222,128,0.55)' : '0 0 28px rgba(74,222,128,0.25)',
            transform: hovered === 'client' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            Get Started <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="split-divider" style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent 5%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.1) 70%, transparent 95%)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', boxShadow: '0 0 12px rgba(255,255,255,0.15)', animation: 'splitPulse 3s ease-in-out infinite' }} />
      </div>

      {/* Trainer panel */}
      <div className="split-panel" role="button" tabIndex={0}
        aria-label="I'm a personal trainer"
        onClick={() => onSelect('trainer')}
        onKeyDown={e => e.key === 'Enter' && onSelect('trainer')}
        onMouseEnter={() => setHovered('trainer')} onMouseLeave={() => setHovered(null)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '100px 48px', cursor: 'pointer', position: 'relative',
          background: 'linear-gradient(160deg, #100e06 0%, #1c1a0c 50%, #100e06 100%)',
          opacity: hovered === 'client' ? 0.15 : 1,
          filter: hovered === 'client' ? 'brightness(0.45) saturate(0.3)' : 'brightness(1)',
          transition: 'opacity 0.45s ease, filter 0.45s ease',
        }}>
        {/* Animated orbs */}
        <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.11) 0%, transparent 70%)', top: '8%', right: '15%', pointerEvents: 'none', animation: 'orb-float 9s ease-in-out infinite 1s', filter: 'blur(2px)' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)', bottom: '20%', left: '12%', pointerEvents: 'none', animation: 'orb-float-2 12s ease-in-out infinite 3s', filter: 'blur(1px)' }} />
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.09) 0%, transparent 70%)', top: '60%', right: '8%', pointerEvents: 'none', animation: 'orb-float-3 15s ease-in-out infinite 5s' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 65% 55% at 50% 25%, rgba(251,191,36,0.09) 0%, transparent 70%)', opacity: hovered === 'trainer' ? 1 : 0.45, transition: 'opacity 0.4s' }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: hovered === 'trainer' ? 'inset 0 0 0 1.5px rgba(251,191,36,0.38)' : 'none', transition: 'box-shadow 0.4s' }} />

        <div style={{ maxWidth: 380, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.28)', borderRadius: 100, padding: '7px 18px', marginBottom: 36 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, boxShadow: '0 0 8px #fbbf24', display: 'block' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fbbf24' }}>I'm a Trainer</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: 0.92, letterSpacing: '-0.025em', color: '#EEF2EE', margin: '0 0 24px' }}>
            Your rates.<br />Your schedule.<br /><span style={{ color: '#fbbf24' }}>Your clients.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.46)', lineHeight: 1.7, margin: '0 0 32px' }}>
            List for free. Keep 80%.<br />Build your practice on your terms.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40, textAlign: 'left' }}>
            {trainerBenefits.map(b => (
              <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fbbf24' }}>
                  <CheckIcon size={10} color="#fbbf24" />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.52)' }}>{b}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#100e06', borderRadius: 11,
            padding: '15px 30px', fontFamily: 'var(--font-heading)', fontWeight: 800,
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            animation: hovered === 'trainer' ? 'btn-glow-amber 2s ease-in-out infinite' : 'none',
            boxShadow: hovered === 'trainer' ? '0 0 48px rgba(251,191,36,0.55)' : '0 0 28px rgba(251,191,36,0.2)',
            transform: hovered === 'trainer' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            Apply Now <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Wordmark */}
      <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', color: 'rgba(238,242,238,0.12)', textTransform: 'uppercase', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
        ReadyPT · Singapore
      </div>
    </div>
  )
}

/* ─── CLIENT JOURNEY ─────────────────────────────────────────── */

function ClientHero() {
  return (
    <section style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', background: '#0d1a0e', position: 'relative', overflow: 'hidden' }}>
      {/* Animated orbs */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,106,46,0.2) 0%, transparent 70%)', top: '-10%', left: '-5%', pointerEvents: 'none', animation: 'orb-float 10s ease-in-out infinite', filter: 'blur(4px)' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)', bottom: '5%', right: '-5%', pointerEvents: 'none', animation: 'orb-float-2 13s ease-in-out infinite 2s', filter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)', top: '60%', left: '40%', pointerEvents: 'none', animation: 'orb-float-3 16s ease-in-out infinite 4s' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 60% at 25% 45%, rgba(45,106,46,0.08) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 45% 45% at 78% 50%, rgba(74,222,128,0.04) 0%, transparent 60%)' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 100px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="chero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left: copy */}
          <div style={{ animation: 'fadeSlideUp 0.7s ease 0.1s both' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 100, padding: '7px 16px', marginBottom: 32,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0, boxShadow: '0 0 8px #4ade80', display: 'block' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4ade80' }}>Singapore's Personal Training Marketplace</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(48px, 6.5vw, 84px)', lineHeight: 0.92, letterSpacing: '-0.025em', color: '#EEF2EE', margin: '0 0 28px' }}>
              Find your<br />trainer.<br /><span style={{ color: '#4ade80' }}>Change<br />your life.</span>
            </h1>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(238,242,238,0.55)', maxWidth: 440, lineHeight: 1.7, margin: '0 0 40px' }}>
              See real trainer profiles, real rates, and real reviews — then book in minutes. No gym. No contracts.
            </p>

            {/* Trust metrics */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 44 }}>
              {[
                { n: '40+', d: 'Verified trainers' },
                { n: '$65–$150', d: 'Per session' },
                { n: 'Zero', d: 'Lock-in contracts' },
              ].map(({ n, d }) => (
                <div key={n} style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 12, padding: '12px 18px', boxShadow: '0 0 20px rgba(74,222,128,0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 18, color: '#4ade80', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.45)', marginTop: 2 }}>{d}</div>
                </div>
              ))}
            </div>

            <a href="#trainers"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#071a0b', textDecoration: 'none', background: 'linear-gradient(135deg, #4ade80, #22c55e)', padding: '16px 34px', borderRadius: 12, animation: 'btn-glow-green 2.5s ease-in-out infinite', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}>
              Browse Trainers <ArrowRight />
            </a>
          </div>

          {/* Right: trainer preview cards */}
          <div className="chero-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 280, height: 280, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,242,238,0.28)', marginBottom: 4 }}>
              Available this week
            </div>

            {TRAINERS.slice(0, 4).map((t, i) => (
              <div key={t.id} className={i >= 2 ? 'chero-cards-extra' : ''} style={{
                opacity: i === 3 ? 0.38 : 1,
                transform: i === 3 ? 'scale(0.97)' : 'scale(1)',
                transformOrigin: 'top',
              }}>
                <TrainerMiniCard trainer={t} delay={0.2 + i * 0.1} />
              </div>
            ))}

            <div style={{ textAlign: 'center', paddingTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.28)' }}>+36 more trainers across Singapore</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .chero-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .chero-cards-extra{display:none!important;}
        }
      `}</style>
    </section>
  )
}

/* ─── FeaturedTrainers ───────────────────────────────────────── */
const GOALS = [
  { label: 'Lose weight', key: 'Lose weight', context: "Singapore's top trainers for fat loss" },
  { label: 'Build muscle', key: 'Build muscle', context: "Singapore's top trainers for strength & muscle" },
  { label: 'Train through pregnancy', key: 'Train through pregnancy', context: "Singapore's specialist prenatal & postnatal trainers" },
  { label: 'Improve sports performance', key: 'Improve sports performance', context: "Singapore's top trainers for sports performance" },
  { label: 'Just start somewhere', key: 'Just start somewhere', context: "Great trainers for anyone starting their fitness journey" },
]

const REGIONS = ['Central', 'East', 'West', 'North', 'North-East']

function FeaturedTrainers() {
  const [activeGoal, setActiveGoal] = useState(() => {
    const v = localStorage.getItem('fg_goal')
    if (v) { localStorage.removeItem('fg_goal'); return v }
    return null
  })
  const [activeRegion, setActiveRegion] = useState(() => {
    const v = localStorage.getItem('fg_region')
    if (v) { localStorage.removeItem('fg_region'); return v }
    return null
  })
  const [ref, visible] = useScrollReveal(0.08)

  const goToTrainers = () => { window.location.href = '/trainers' }

  const matchesGoal = t => !activeGoal || t.goals.includes(activeGoal)
  const matchesRegion = t => !activeRegion || t.regions.includes(activeRegion)
  const spotlightTrainers = TRAINERS.filter(t => matchesGoal(t) && matchesRegion(t))
  const showSpotlight = (activeGoal || activeRegion) && spotlightTrainers.length > 0
  const showEmptyState = (activeGoal && activeRegion) && spotlightTrainers.length === 0

  const goalData = GOALS.find(g => g.key === activeGoal)
  const spotlightContext = (() => {
    if (activeGoal && activeRegion) return `${goalData?.context} in the ${activeRegion}`
    if (activeGoal) return goalData?.context
    if (activeRegion) return `Trainers available in the ${activeRegion}`
    return ''
  })()

  return (
    <section id="trainers" ref={ref} style={{ background: '#091210', padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(45,106,46,0.09) 0%, transparent 55%)' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)', transition: 'opacity 0.65s ease, transform 0.65s ease', marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, marginBottom: 32 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 16px' }}>Browse Trainers</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: 0, maxWidth: 560 }}>
                Singapore's finest<br />trainers, verified.
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 10, padding: '12px 18px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>40+ trainers</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.4)' }}>verified & ready to book</div>
              </div>
            </div>
          </div>

          {/* Goal chips */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', margin: '0 0 12px', letterSpacing: '0.04em' }}>What's your goal?</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {GOALS.map(g => (
              <button key={g.key} onClick={() => setActiveGoal(activeGoal === g.key ? null : g.key)} style={{
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
                padding: '9px 20px', borderRadius: 100,
                border: `1px solid ${activeGoal === g.key ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: activeGoal === g.key ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.04)',
                color: activeGoal === g.key ? '#4ade80' : 'rgba(238,242,238,0.55)',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: activeGoal === g.key ? '0 0 14px rgba(74,222,128,0.2)' : 'none',
              }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Region pills */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', margin: '20px 0 12px', letterSpacing: '0.04em' }}>Where do you train?</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {REGIONS.map(r => (
              <button key={r} onClick={() => setActiveRegion(activeRegion === r ? null : r)} style={{
                fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
                padding: '9px 20px', borderRadius: 100,
                border: `1px solid ${activeRegion === r ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.1)'}`,
                background: activeRegion === r ? 'rgba(74,222,128,0.14)' : 'rgba(255,255,255,0.04)',
                color: activeRegion === r ? '#4ade80' : 'rgba(238,242,238,0.55)',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: activeRegion === r ? '0 0 14px rgba(74,222,128,0.2)' : 'none',
              }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Spotlight */}
        {showEmptyState && (
          <div style={{ marginBottom: 48, padding: '24px 28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.45)', margin: 0 }}>
              No {goalData?.label.toLowerCase()} specialists in the {activeRegion} yet — showing all {goalData?.label.toLowerCase()} trainers instead.{' '}
              <button onClick={() => setActiveRegion(null)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14, padding: 0, textDecoration: 'underline' }}>
                Clear location ×
              </button>
            </p>
          </div>
        )}

        {showSpotlight && (
          <div style={{
            marginBottom: 48,
            padding: '28px 28px 20px',
            background: 'rgba(74,222,128,0.04)',
            border: '1px solid rgba(74,222,128,0.14)',
            borderRadius: 16,
          }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>
              {spotlightContext}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {spotlightTrainers.map(t => (
                <TrainerCard key={t.id} trainer={t} onJoin={goToTrainers} />
              ))}
            </div>
          </div>
        )}

        {/* Full trainer grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {TRAINERS.map((t, i) => (
            <div key={t.id} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)', transition: `opacity 0.6s ease ${0.1 + i * 0.08}s, transform 0.6s ease ${0.1 + i * 0.08}s` }}>
              <TrainerCard trainer={t} onJoin={goToTrainers} />
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', marginTop: 60, opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease 0.55s' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.38)', margin: '0 0 24px' }}>
            Showing 6 of 40+ trainers across Singapore
          </p>
          <a href="/trainers" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: '#4ade80', textDecoration: 'none',
            border: '1px solid rgba(74,222,128,0.25)', padding: '13px 30px', borderRadius: 10,
            background: 'rgba(74,222,128,0.06)', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.12)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(74,222,128,0.06)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)' }}>
            Browse all trainers <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  )
}

function ClientHowItWorks() {
  const [ref, visible] = useScrollReveal()
  const steps = [
    { num: '01', title: 'Browse verified trainers', body: 'Filter by goal, location, and price. Every trainer is certified with real client reviews. No guessing.' },
    { num: '02', title: 'Book in minutes', body: 'Pick a time, pay securely. No emails, no contracts, no commitment beyond the session.' },
    { num: '03', title: 'Train and transform', body: 'Your trainer, your goals, your pace. One session or a full programme — entirely your call.' },
  ]
  return (
    <section id="how-it-works" ref={ref} style={{ background: '#0d1a0e', padding: '104px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 18px' }}>How It Works</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 560 }}>
            Three steps to your first session.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 3 }}>
          {steps.map(({ num, title, body }, i) => (
            <div key={num} style={{
              padding: '48px 36px',
              background: i === 1 ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i === 1 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 14,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.15 + i * 0.12}s, transform 0.6s ease ${0.15 + i * 0.12}s`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: i === 1 ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 22, color: '#4ade80', letterSpacing: '-0.03em' }}>{num}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(74,222,128,0.3), transparent)' }} />}
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 14px' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.52)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientReassurance() {
  const [ref, visible] = useScrollReveal()
  const cards = [
    {
      concern: 'Not sure who to trust?',
      resolution: 'Every trainer on ReadyPT is certified and verified before going live. You see their qualifications, real client reviews, and training style — before you commit to anything.',
    },
    {
      concern: 'Worried about hidden costs?',
      resolution: "Every trainer lists their exact session rate upfront. You know what you're paying before you book. No hidden platform fees, no surprises at checkout.",
    },
    {
      concern: 'Not ready to commit long-term?',
      resolution: "Book a single session first. See how it feels. No packages, no contracts, no pressure to sign anything before you're ready.",
    },
  ]
  return (
    <section ref={ref} style={{ background: '#0a140b', padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 85% 50%, rgba(45,106,46,0.06) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 18px' }}>Why ReadyPT</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 680 }}>
            We thought about what holds people back. Then we fixed it.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {cards.map(({ concern, resolution }, i) => (
            <div key={concern} style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: '3px solid rgba(74,222,128,0.5)',
              borderRadius: '0 16px 16px 0',
              padding: '36px 32px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2), -1px 0 0 rgba(74,222,128,0.12)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
            }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 21, color: '#EEF2EE', margin: '0 0 14px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{concern}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.52)', lineHeight: 1.7, margin: 0 }}>{resolution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientTestimonials() {
  const [ref, visible] = useScrollReveal()
  const testimonials = [
    { quote: 'I found Marcus in a week after reading his real reviews and seeing his actual training style. Six months later I\'m down 14kg — something three different gym trainers couldn\'t do.', name: 'Natasha L.', detail: 'Client · Tampines', stars: 5, initials: 'NL', bg: 'linear-gradient(135deg,#1a4a2e,#2d6a3e)' },
    { quote: 'Being able to book a single session first made all the difference — no long-term commitment before I knew it was right. Priya has been training me through my second pregnancy and I feel stronger than ever.', name: 'Divya R.', detail: 'Client · River Valley', stars: 5, initials: 'DR', bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)' },
    { quote: 'ReadyPT showed me certified trainers at every price point, with rates listed upfront. I know what I pay, my trainer knows what I need.', name: 'Wei Ming T.', detail: 'Client · Jurong', stars: 5, initials: 'WT', bg: 'linear-gradient(135deg,#0c4a6e,#0369a1)' },
  ]
  return (
    <section ref={ref} style={{ background: '#0d1a0e', padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 70% at 15% 50%, rgba(45,106,46,0.07) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 18px' }}>Real Stories</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 56px', maxWidth: 560 }}>
            Lives changed. In Singapore.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {testimonials.map(({ quote, name, detail, stars, initials, bg }, i) => (
            <div key={name} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '32px', display: 'flex', flexDirection: 'column',
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
              borderTop: '1px solid rgba(74,222,128,0.25)',
            }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                {Array.from({ length: stars }).map((_, j) => <StarIcon key={j} size={14} color="#4ade80" filled />)}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.62)', lineHeight: 1.75, margin: '0 0 28px', flex: 1 }}>"{quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>{detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ClientCTA() {
  const [ref, visible] = useScrollReveal()
  return (
    <section ref={ref} style={{ background: '#071a0b', padding: '104px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(45,106,46,0.14) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: 'opacity 0.7s, transform 0.7s' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 20px' }}>Get Started</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 28px' }}>
          Your transformation<br />starts with<br /><span style={{ color: '#4ade80' }}>one decision.</span>
        </h2>
        <a href="#waitlist"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#071a0b', textDecoration: 'none', background: 'linear-gradient(135deg, #4ade80, #22c55e)', padding: '20px 44px', borderRadius: 14, animation: 'btn-glow-green 2s ease-in-out infinite', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)' }}>
          Find your trainer <ArrowRight />
        </a>
      </div>
    </section>
  )
}

function ClientPage() {
  return (
    <>
      <ClientHero />
      <FeaturedTrainers />
      <ClientReassurance />
      <ClientHowItWorks />
      <ClientTestimonials />
      <ClientCTA />
      <Waitlist defaultRole="client" />
    </>
  )
}

/* ─── TRAINER JOURNEY ────────────────────────────────────────── */

function EarningsCalculator() {
  const [rate, setRate] = useState(120)
  const [sessions, setSessions] = useState(12)
  const monthly = Math.round(rate * sessions * 4.3 * 0.8)
  const annual = monthly * 12
  const fmt = n => n >= 1000 ? '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : '$' + n

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px', position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(238,242,238,0.35)', marginBottom: 28 }}>
        What could you earn on ReadyPT?
      </div>

      {/* Rate slider */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)' }}>Rate per session</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: '#fbbf24', letterSpacing: '-0.02em' }}>${rate}</span>
        </div>
        <input type="range" min={50} max={200} step={5} value={rate} onChange={e => setRate(+e.target.value)}
          style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer', height: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(238,242,238,0.25)' }}>$50</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(238,242,238,0.25)' }}>$200</span>
        </div>
      </div>

      {/* Sessions slider */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.5)' }}>Sessions per week</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color: '#fbbf24', letterSpacing: '-0.02em' }}>{sessions}</span>
        </div>
        <input type="range" min={1} max={20} step={1} value={sessions} onChange={e => setSessions(+e.target.value)}
          style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer', height: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(238,242,238,0.25)' }}>1</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(238,242,238,0.25)' }}>20</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

      {/* Output */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.4)', marginBottom: 6 }}>Monthly take-home</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: '#fbbf24', letterSpacing: '-0.025em' }}>{fmt(monthly)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.4)', marginBottom: 6 }}>Annual projection</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: 'rgba(238,242,238,0.7)', letterSpacing: '-0.025em' }}>{fmt(annual)}</div>
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.22)', margin: '14px 0 0', lineHeight: 1.5 }}>
        Based on 80% trainer share · 4.3 weeks/month
      </p>
    </div>
  )
}

function TrainerHero({ onApply = () => {} }) {
  return (
    <section style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', background: '#100e06', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 60% at 30% 40%, rgba(251,191,36,0.14) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 40% 40% at 80% 60%, rgba(251,191,36,0.05) 0%, transparent 60%)' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '140px 24px 100px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="thero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          {/* Left: copy */}
          <div style={{ animation: 'fadeSlideUp 0.7s ease 0.1s both' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 100, padding: '7px 16px', marginBottom: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', flexShrink: 0, boxShadow: '0 0 8px #fbbf24', display: 'block' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fbbf24' }}>For Personal Trainers in Singapore</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(40px, 5.5vw, 72px)', lineHeight: 0.95, letterSpacing: '-0.025em', color: '#EEF2EE', margin: '0 0 28px' }}>
              Singapore's top trainers deserve better than<br /><span style={{ color: '#fbbf24' }}>word of mouth.</span>
            </h1>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(238,242,238,0.55)', maxWidth: 440, lineHeight: 1.7, margin: '0 0 40px' }}>
              A verified profile, instant booking, and clients who find you — so you can focus on what you do best.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 44 }}>
              {[
                { n: '80%', d: 'you keep per session' },
                { n: 'Free', d: 'to list your profile' },
                
              ].map(({ n, d }) => (
                <div key={n} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 16px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 16, color: '#fbbf24', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{n}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.38)', marginTop: 1 }}>{d}</div>
                </div>
              ))}
            </div>

            <button onClick={onApply}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#100e06', background: '#fbbf24', border: 'none', padding: '16px 32px', borderRadius: 10, cursor: 'pointer', boxShadow: '0 0 44px rgba(251,191,36,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fde68a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 64px rgba(251,191,36,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 44px rgba(251,191,36,0.3)' }}>
              Apply as a Trainer <ArrowRight />
            </button>
          </div>

          {/* Right: earnings calculator */}
          <div className="thero-visual" style={{ animation: 'fadeSlideUp 0.7s ease 0.3s both' }}>
            <EarningsCalculator />
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){
          .thero-grid{grid-template-columns:1fr!important;gap:48px!important;}
          .thero-visual{display:none!important;}
        }
      `}</style>
    </section>
  )
}

function TrainerAspiration() {
  const [ref, visible] = useScrollReveal()
  const cards = [
    {
      n: '01',
      title: 'Your skills should speak for themselves.',
      body: 'You\'ve put in the certifications, the hours, the results. Your ReadyPT profile makes sure the right clients see exactly why you\'re the right fit — before they even reach out.',
    },
    {
      n: '02',
      title: 'The right clients should be able to find you.',
      body: 'Motivated, ready-to-book clients searching specifically for your specialty. Not random enquiries — people who already want what you offer, finding you directly.',
    },
    {
      n: '03',
      title: 'Your income should reflect your expertise.',
      body: 'Set the rate that matches your experience and results. Keep 80% of every session. As your reputation on the platform grows, so does your earning power.',
    },
  ]
  return (
    <section ref={ref} style={{ background: '#0c0a04', padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 60% at 85% 50%, rgba(251,191,36,0.05) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fbbf24', margin: '0 0 18px' }}>Built For Trainers</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 680 }}>
            A platform built around what you deserve.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {cards.map(({ n, title, body }, i) => (
            <div key={n} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderTop: '3px solid rgba(251,191,36,0.35)',
              borderRadius: '0 0 14px 14px',
              padding: '36px 32px',
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'rgba(251,191,36,0.5)', margin: '0 0 18px', textTransform: 'uppercase' }}>{n}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 21, color: '#EEF2EE', margin: '0 0 14px', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.48)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerHowItWorks() {
  const [ref, visible] = useScrollReveal()
  const steps = [
    { num: '01', title: 'Build your profile', body: 'Showcase your certifications, specialty, training style, and locations. Your profile is your professional home on ReadyPT — and it works for you around the clock.' },
    { num: '02', title: 'Set your rates and availability', body: 'You decide your price per session and when you\'re available. No imposed tiers, no minimums. Entirely on your terms.' },
    { num: '03', title: 'Get booked, get paid', body: 'Clients discover you, book, and pay through ReadyPT. You keep 80% of every session, paid out automatically.' },
  ]
  return (
    <section id="how-it-works" ref={ref} style={{ background: '#100e06', padding: '104px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fbbf24', margin: '0 0 18px' }}>How It Works</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 72px', maxWidth: 560 }}>
            List once. Train on your terms.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 3 }}>
          {steps.map(({ num, title, body }, i) => (
            <div key={num} style={{
              padding: '48px 36px',
              background: i === 1 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${i === 1 ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: 14,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.15 + i * 0.12}s, transform 0.6s ease ${0.15 + i * 0.12}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 72, lineHeight: 1, color: 'rgba(251,191,36,0.1)', letterSpacing: '-0.04em', marginBottom: 24 }}>{num}</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 14px' }}>{title}</h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.48)', lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerValueProps() {
  const [ref, visible] = useScrollReveal()
  const items = [
    { title: 'Keep 80% of every session you run.', body: 'Set a rate of $120 per session and take home $96 — every time. Transparent, consistent, and entirely yours.' },
    { title: 'Set your rate, on your terms.', body: 'Charge what your experience is worth. ReadyPT has no imposed tiers, no caps, and no minimums. As your reputation grows, so can your rate.' },
    { title: 'Every client relationship is yours to keep.', body: 'Your profile builds your reputation. Your reviews travel with you. The practice you build on ReadyPT belongs to you.' },
  ]
  return (
    <section ref={ref} style={{ background: '#0c0a04', padding: '104px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fbbf24', margin: '0 0 18px' }}>Why ReadyPT</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 64px', maxWidth: 620 }}>
            A platform that works as hard as you do.
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map(({ title, body }, i) => (
            <div key={title} style={{
              display: 'flex', alignItems: 'flex-start', gap: 28, padding: '36px 36px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14,
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
            }}>
              <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginTop: 2 }}>
                <CheckIcon size={15} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 19, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#EEF2EE', margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.48)', lineHeight: 1.7, margin: 0, maxWidth: 680 }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerTestimonials() {
  const [ref, visible] = useScrollReveal()
  const testimonials = [
    { quote: 'I listed my profile in under 20 minutes. Within two weeks I had three new clients booking regular sessions. ReadyPT brought me people I never would have reached through referrals alone.', name: 'Marcus T.', detail: 'Strength & Conditioning · Tampines', stars: 5, initials: 'MT', bg: 'linear-gradient(135deg,#14532d,#166534)' },
    { quote: 'My prenatal specialisation finally has an audience. Clients searching for exactly what I offer find my profile, read my reviews, and book — often the same day. It\'s the most efficient part of running my practice.', name: 'Priya S.', detail: 'Pre & Postnatal · Orchard', stars: 5, initials: 'PS', bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)' },
    { quote: 'The income consistency has been the biggest change. I set my rate, I show up, I get paid. ReadyPT handles everything in between so I can focus entirely on my clients.', name: 'Daniel W.', detail: 'HIIT & Fat Loss · CBD', stars: 5, initials: 'DW', bg: 'linear-gradient(135deg,#0c4a6e,#0369a1)' },
  ]
  return (
    <section ref={ref} style={{ background: '#100e06', padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 50% 70% at 15% 50%, rgba(251,191,36,0.05) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'opacity 0.6s, transform 0.6s' }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fbbf24', margin: '0 0 18px' }}>Trainer Stories</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(34px, 5.5vw, 66px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 56px', maxWidth: 560 }}>
            Real trainers. Real earnings.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {testimonials.map(({ quote, name, detail, stars, initials, bg }, i) => (
            <div key={name} style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 18, padding: '32px', display: 'flex', flexDirection: 'column',
              opacity: visible ? 1 : 0,
              transform: visible ? 'none' : 'translateY(28px)',
              transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
            }}>
              <div style={{ display: 'flex', gap: 3, marginBottom: 20 }}>
                {Array.from({ length: stars }).map((_, j) => <StarIcon key={j} size={13} color="#fbbf24" filled />)}
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.62)', lineHeight: 1.75, margin: '0 0 28px', flex: 1 }}>"{quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, color: '#fff', flexShrink: 0 }}>{initials}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: '#EEF2EE', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.35)', marginTop: 2 }}>{detail}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TrainerCTA({ onApply = () => {} }) {
  const [ref, visible] = useScrollReveal()
  return (
    <section ref={ref} style={{ background: '#0c0a04', padding: '104px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 65%)' }} />
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: 'opacity 0.7s, transform 0.7s' }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fbbf24', margin: '0 0 20px' }}>Apply Now</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(36px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '0 0 28px' }}>
          List your profile.<br />Reach more clients.<br /><span style={{ color: '#fbbf24' }}>Grow your practice.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'rgba(238,242,238,0.48)', lineHeight: 1.65, margin: '0 0 48px' }}>
          Join the waitlist and be first to list your profile.
        </p>
        <button onClick={onApply}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0c0a04', background: '#fbbf24', border: 'none', padding: '18px 40px', borderRadius: 10, cursor: 'pointer', boxShadow: '0 0 48px rgba(251,191,36,0.3)', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fde68a'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fbbf24'; e.currentTarget.style.transform = 'translateY(0)' }}>
          Apply as a Trainer <ArrowRight />
        </button>
      </div>
    </section>
  )
}

function TrainerPage({ onApply = () => {} }) {
  return (
    <>
      <TrainerHero onApply={onApply} />
      <TrainerAspiration />
      <TrainerHowItWorks />
      <TrainerValueProps />
      <TrainerTestimonials />
      <TrainerCTA onApply={onApply} />
      <Waitlist defaultRole="trainer" />
    </>
  )
}

/* ─── Waitlist ───────────────────────────────────────────────── */
function Waitlist({ defaultRole = 'client' }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const isTrainer = role === 'trainer'
  const accent = isTrainer ? '#fbbf24' : '#4ade80'
  const bg = isTrainer ? '#100e06' : '#0d1a0e'

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 800)
  }

  return (
    <section id="waitlist" style={{ background: bg, padding: '104px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 75% at 50% 50%, ${isTrainer ? 'rgba(251,191,36,0.08)' : 'rgba(45,106,46,0.1)'} 0%, transparent 65%)` }} />

      <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent }}>Early Access</span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(40px, 7vw, 80px)', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#EEF2EE', margin: '16px 0 18px' }}>
          Join the<br /><span style={{ color: accent }}>waitlist.</span>
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(238,242,238,0.48)', margin: '0 0 44px', lineHeight: 1.6 }}>
          {isTrainer
            ? 'The first step to more clients starts here. List your profile free and start building your practice.'
            : 'Be first to access Singapore\'s top verified trainers when we launch.'}
        </p>

        {submitted ? (
          <div style={{ background: `rgba(${isTrainer ? '251,191,36' : '45,106,46'},0.08)`, border: `1px solid ${accent}30`, borderRadius: 16, padding: '48px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: accent }}>
              <CheckIcon size={28} color={accent} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', color: '#EEF2EE', margin: '0 0 12px', letterSpacing: '0.01em' }}>You're on the list.</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.5)', margin: 0, lineHeight: 1.6 }}>
              {isTrainer ? 'Expect a personal email from our founder. Welcome to the team.' : 'We\'ll reach out the moment we launch. Get ready.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} aria-label="Waitlist signup">
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, marginBottom: 14 }}>
              {[['client', 'I want a trainer'], ['trainer', 'I am a trainer']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => setRole(val)} style={{
                  flex: 1, padding: '11px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase',
                  background: role === val ? (val === 'trainer' ? '#fbbf24' : '#4ade80') : 'transparent',
                  color: role === val ? (val === 'trainer' ? '#0c0a04' : '#071a0b') : 'rgba(238,242,238,0.4)',
                  transition: 'all 0.2s',
                }}>{lbl}</button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address" aria-label="Email address"
                style={{ width: '100%', boxSizing: 'border-box', padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: `1.5px solid rgba(255,255,255,0.1)`, color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 16, outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = `${accent}60`}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px',
              background: loading ? `${accent}80` : accent,
              color: isTrainer ? '#0c0a04' : '#071a0b', border: 'none', borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 0 32px ${accent}30`,
            }}>
              {loading ? (
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <>{isTrainer ? 'Apply as a Trainer' : 'Join the Waitlist'} <ArrowRight size={16} /></>
              )}
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.28)', marginTop: 12 }}>No spam. One launch email and your early access offer.</p>
          </form>
        )}
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#07090a', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="#" aria-label="ReadyPT home" style={{ textDecoration: 'none' }}>
          <ReadyPTLogo />
        </a>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.28)', margin: 0, textAlign: 'center' }}>
          &copy; 2026 ReadyPT Pte Ltd &middot; Singapore &middot; Confidential
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(74,222,128,0.4)', margin: 0 }}>
          Cut out the middleman.
        </p>
      </div>
    </footer>
  )
}

/* ─── Landing ────────────────────────────────────────────────── */
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
        {role === 'trainer' && <TrainerPage onApply={() => navigate('/signup/trainer')} />}
      </main>
      {role !== null && <Footer />}
    </>
  )
}

/* ─── App ────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/trainer" element={<Navigate to="/signup/trainer" replace />} />
      <Route path="/signup" element={<SignupEntryPage />} />
      <Route path="/signup/client" element={<ClientSignupPage />} />
      <Route path="/signup/client/profile" element={
        <ProtectedRoute><ClientProfileSetupPage /></ProtectedRoute>
      } />
      <Route path="/signup/trainer" element={<RegisterTrainerPage />} />
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
      <Route path="/trainers" element={<TrainerListingPage />} />
      <Route path="/trainer/:id" element={<TrainerProfilePage />} />
      <Route path="/booking/confirmed" element={
        <ProtectedRoute><BookingConfirmedPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/client" element={
        <ProtectedRoute><ClientDashboardPage /></ProtectedRoute>
      } />
    </Routes>
  )
}
