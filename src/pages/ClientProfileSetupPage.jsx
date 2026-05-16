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

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

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

    // Guard: prevent overwriting an existing non-client account (e.g. trainer, admin)
    const { data: existing } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
    if (existing && existing.role !== 'client') {
      setServerError(`An account with role "${existing.role}" already exists for this email.`)
      setSubmitting(false)
      return
    }

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
