import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
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
  const { session, profile, loading: authLoading } = useAuth()
  const initialTab = searchParams.get('role') === 'trainer' ? 'trainer' : 'client'
  const [tab, setTab] = useState(initialTab)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect to the right place
  useEffect(() => {
    if (authLoading) return
    if (!session) return
    if (profile === undefined) return // still fetching profile
    if (profile?.role === 'admin') navigate('/admin', { replace: true })
    else if (profile?.role === 'trainer') navigate('/dashboard/trainer', { replace: true })
    else navigate('/', { replace: true })
  }, [authLoading, session, profile, navigate])

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

    const redirectTo = searchParams.get('redirect')
    if (redirectTo) { navigate(redirectTo); return }
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
