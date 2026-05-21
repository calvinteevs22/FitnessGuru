// src/pages/ClientProfileTab.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }
const SECTION_TITLE = { color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20, marginTop: 0 }
const INPUT_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, padding: '10px 14px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced']
const REGIONS = ['Central', 'North', 'Northeast', 'East', 'West']

export default function ClientProfileTab({ clientId, fullName: initialFullName, email }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  // Fields from profiles
  const [fullName, setFullName] = useState(initialFullName ?? '')

  // Fields from client_profiles
  const [fitnessGoal, setFitnessGoal] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('')
  const [preferredRegion, setPreferredRegion] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [budgetSgd, setBudgetSgd] = useState('')

  const load = useCallback(async () => {
    const [profileRes, cpRes] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', clientId).single(),
      supabase.from('client_profiles').select('*').eq('id', clientId).maybeSingle(),
    ])
    if (profileRes.data?.full_name) setFullName(profileRes.data.full_name)
    const cp = cpRes.data
    if (cp) {
      setFitnessGoal(cp.fitness_goal ?? '')
      setFitnessLevel(cp.fitness_level ?? '')
      setPreferredRegion(cp.preferred_region ?? '')
      setHeightCm(cp.height_cm != null ? String(cp.height_cm) : '')
      setBudgetSgd(cp.budget_sgd != null ? String(cp.budget_sgd) : '')
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const h = heightCm !== '' ? parseFloat(heightCm) : null
    const b = budgetSgd !== '' ? parseInt(budgetSgd, 10) : null

    if (h !== null && (isNaN(h) || h <= 100 || h >= 250)) return setError('Height must be between 100–250 cm.')
    if (b !== null && (isNaN(b) || b < 0)) return setError('Budget must be a positive number.')
    if (!fullName.trim()) return setError('Name is required.')

    setSaving(true)

    const [nameRes, cpRes] = await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', clientId),
      supabase.from('client_profiles').upsert({
        id: clientId,
        fitness_goal: fitnessGoal || null,
        fitness_level: fitnessLevel || null,
        preferred_region: preferredRegion || null,
        height_cm: h,
        budget_sgd: b,
      }, { onConflict: 'id' }),
    ])

    setSaving(false)
    if (nameRes.error) return setError(nameRes.error.message)
    if (cpRes.error) return setError(cpRes.error.message)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return null

  return (
    <div>
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>My Profile</h3>
        <form onSubmit={handleSave}>
          {/* Personal */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ ...LABEL, marginBottom: 14, color: 'rgba(238,242,238,0.3)' }}>Personal</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={LABEL}>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  style={INPUT_STYLE}
                  placeholder="Your full name"
                />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={LABEL}>Email</label>
                <input type="text" value={email} disabled style={{ ...INPUT_STYLE, opacity: 0.4, cursor: 'not-allowed' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 130px' }}>
                <label style={LABEL}>Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="100"
                  max="250"
                  placeholder="e.g. 170"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={LABEL}>Monthly Budget (S$)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="e.g. 500"
                  value={budgetSgd}
                  onChange={e => setBudgetSgd(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          </div>

          {/* Fitness */}
          <div style={{ borderTop: '1px solid rgba(238,242,238,0.06)', paddingTop: 20, marginBottom: 24 }}>
            <p style={{ ...LABEL, marginBottom: 14, color: 'rgba(238,242,238,0.3)' }}>Fitness</p>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL}>Fitness Goal</label>
              <input
                type="text"
                placeholder="e.g. Lose 10kg, build muscle, run a 5K…"
                value={fitnessGoal}
                onChange={e => setFitnessGoal(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={LABEL}>Fitness Level</label>
                <select value={fitnessLevel} onChange={e => setFitnessLevel(e.target.value)} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                  <option value="">Select level</option>
                  {FITNESS_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={LABEL}>Preferred Region</label>
                <select value={preferredRegion} onChange={e => setPreferredRegion(e.target.value)} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                  <option value="">Any region</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 24px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
