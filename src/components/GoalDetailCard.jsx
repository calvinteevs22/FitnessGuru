// src/components/GoalDetailCard.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import ProgressRing from './ProgressRing'
import MilestoneBadges from './MilestoneBadges'

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)) }

function computeProgress(goal, latestMetric) {
  if (!goal || !latestMetric) return { weightProgress: 0, fatProgress: 0, maxProgress: 0 }
  const weightProgress = clamp(
    (goal.start_weight_kg - latestMetric.weight_kg) / (goal.start_weight_kg - goal.goal_weight_kg),
    0, 1
  )
  const fatProgress = (goal.start_body_fat_pct && latestMetric.body_fat_pct && goal.goal_body_fat_pct)
    ? clamp(
        (goal.start_body_fat_pct - latestMetric.body_fat_pct) / (goal.start_body_fat_pct - goal.goal_body_fat_pct),
        0, 1
      )
    : 0
  return { weightProgress, fatProgress, maxProgress: Math.max(weightProgress, fatProgress) }
}

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }
const INPUT_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, padding: '10px 14px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

export default function GoalDetailCard({ clientId }) {
  const [goal, setGoal] = useState(null)
  const [latestMetric, setLatestMetric] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [goalWeight, setGoalWeight] = useState('')
  const [goalFat, setGoalFat] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })

  const load = useCallback(async () => {
    const [goalRes, metricsRes] = await Promise.all([
      supabase.from('client_goals').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_body_metrics').select('measured_at, weight_kg, body_fat_pct')
        .eq('client_id', clientId).order('measured_at', { ascending: false }).limit(1),
    ])
    setGoal(goalRes.data ?? null)
    setLatestMetric(metricsRes.data?.[0] ?? null)
    setLoading(false)
  }, [clientId])

  useEffect(() => { load() }, [load])

  function openForm() {
    if (goal) {
      setGoalWeight(String(goal.goal_weight_kg))
      setGoalFat(String(goal.goal_body_fat_pct))
      setTargetDate(goal.target_date ?? '')
    } else {
      setGoalWeight('')
      setGoalFat('')
      setTargetDate('')
    }
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError(null)
    const w = parseFloat(goalWeight)
    const f = parseFloat(goalFat)
    if (isNaN(w) || w < 20 || w > 300) return setFormError('Goal weight must be between 20–300 kg.')
    if (isNaN(f) || f < 1 || f > 60) return setFormError('Goal body fat % must be between 1–60.')
    if (targetDate && targetDate <= today) return setFormError('Target date must be in the future.')
    if (!latestMetric) return setFormError('Log a weigh-in first so we can track your starting point.')
    if (latestMetric.weight_kg === w) return setFormError('Goal weight must differ from your current weight.')

    setSaving(true)
    const isNew = !goal
    const payload = {
      client_id: clientId,
      goal_weight_kg: w,
      goal_body_fat_pct: f,
      target_date: targetDate || null,
      set_by: 'client',
      start_weight_kg: isNew ? latestMetric.weight_kg : goal.start_weight_kg,
      start_body_fat_pct: isNew ? (latestMetric.body_fat_pct ?? f) : goal.start_body_fat_pct,
    }

    const { error } = await supabase.from('client_goals').upsert(payload, { onConflict: 'client_id' })
    setSaving(false)
    if (error) return setFormError(error.message)
    setShowForm(false)
    load()
  }

  if (loading) return null

  const { weightProgress, fatProgress, maxProgress } = computeProgress(goal, latestMetric)
  const hasMetrics = !!latestMetric

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', margin: 0 }}>
          Progress to Goal
        </h3>
        <button
          onClick={openForm}
          style={{ background: 'none', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
        >
          {goal ? 'Edit Goal' : 'Set Goal'}
        </button>
      </div>

      {goal ? (
        <>
          {/* Rings + target info */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <ProgressRing progress={weightProgress} size={120} strokeWidth={10} value={latestMetric?.weight_kg ?? goal.goal_weight_kg} unit="kg" label={`of ${goal.goal_weight_kg}kg`} />
            <ProgressRing progress={fatProgress} size={120} strokeWidth={10} color="#fbbf24" value={latestMetric?.body_fat_pct ?? goal.goal_body_fat_pct} unit="%" label={`of ${goal.goal_body_fat_pct}%`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
                Target: <span style={{ color: '#EEF2EE', fontWeight: 700 }}>{goal.goal_weight_kg}kg · {goal.goal_body_fat_pct}% body fat</span>
              </p>
              {goal.target_date && (
                <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>
                  By {new Date(goal.target_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <p style={{ color: 'rgba(238,242,238,0.3)', fontFamily: 'var(--font-body)', fontSize: 11, margin: 0 }}>
                {goal.set_by === 'trainer' ? 'Set by your trainer' : 'Your personal goal'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <MilestoneBadges maxProgress={maxProgress} hasMetrics={hasMetrics} />
        </>
      ) : (
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14, margin: '0 0 16px' }}>
          Set a goal to track your progress with rings, badges, and pace tracking.
        </p>
      )}

      {/* Inline form */}
      {showForm && (
        <form onSubmit={handleSave} style={{ marginTop: 20, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ flex: '1 1 130px' }}>
              <label style={LABEL}>Target Weight (kg) *</label>
              <input type="number" step="0.1" placeholder="e.g. 70.0" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} style={INPUT_STYLE} required />
            </div>
            <div style={{ flex: '1 1 130px' }}>
              <label style={LABEL}>Target Body Fat % *</label>
              <input type="number" step="0.1" placeholder="e.g. 15.0" value={goalFat} onChange={e => setGoalFat(e.target.value)} style={INPUT_STYLE} required />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label style={LABEL}>Target Date (optional)</label>
              <input type="date" min={today} value={targetDate} onChange={e => setTargetDate(e.target.value)} style={INPUT_STYLE} />
            </div>
          </div>
          {formError && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 12px' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ background: 'none', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
