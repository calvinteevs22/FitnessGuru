import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

export default function PageNav() {
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [scrolled] = useState(false)
  const authRole = profile?.role ?? null

  const dashPath =
    authRole === 'admin' ? '/admin' :
    authRole === 'trainer' ? '/dashboard/trainer' :
    '/dashboard/client'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(13,26,14,0.96)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
    }}>
      <nav style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo → home */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          aria-label="ReadyPT home"
        >
          <img src="/readypt-logo.svg" alt="ReadyPT" width={34} height={34} style={{ borderRadius: 8, display: 'block' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 19, color: '#EEF2EE', letterSpacing: '-0.01em' }}>
            Ready<span style={{ color: '#4ade80' }}>PT</span>
          </span>
        </button>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {session ? (
            <>
              <button
                onClick={() => navigate(dashPath)}
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                  color: 'rgba(238,242,238,0.6)', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}
              >
                Dashboard
              </button>
              <button
                onClick={() => signOut()}
                style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: 'rgba(238,242,238,0.6)', background: 'none',
                  border: '1px solid rgba(238,242,238,0.18)', borderRadius: 8,
                  padding: '8px 18px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(238,242,238,0.45)'; e.currentTarget.style.color = '#EEF2EE' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(238,242,238,0.18)'; e.currentTarget.style.color = 'rgba(238,242,238,0.6)' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                style={{
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                  color: 'rgba(238,242,238,0.6)', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#EEF2EE'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,238,0.6)'}
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/signup/client')}
                style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: '#0d1a0e', background: '#4ade80', border: 'none',
                  borderRadius: 8, padding: '9px 20px', cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
