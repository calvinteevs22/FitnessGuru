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
