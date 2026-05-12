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
