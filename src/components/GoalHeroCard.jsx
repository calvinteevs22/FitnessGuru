// src/components/GoalHeroCard.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressRing from './ProgressRing'

function computeStreak(metrics) {
  if (!metrics || metrics.length === 0) return 0
  const weekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }
  const weekSet = new Set(metrics.map(m => weekStart(m.measured_at)))
  let streak = 0
  const checkDate = new Date()
  while (true) {
    const ws = weekStart(checkDate)
    if (weekSet.has(ws)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 7)
    } else break
  }
  return streak
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

function computeProgress(goal, latestMetric) {
  if (!goal || !latestMetric) return { weightProgress: 0, fatProgress: 0 }
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
  return { weightProgress, fatProgress }
}

function computePace(goal, weightProgress) {
  if (!goal?.target_date) return null
  const created = new Date(goal.created_at)
  const target = new Date(goal.target_date)
  const today = new Date()
  const totalDays = (target - created) / (1000 * 60 * 60 * 24)
  const elapsedDays = (today - created) / (1000 * 60 * 60 * 24)
  if (totalDays <= 0) return null
  const expectedPct = Math.min(1, elapsedDays / totalDays)
  if (weightProgress >= expectedPct + 0.1) return 'Ahead'
  if (weightProgress >= expectedPct - 0.05) return 'On track'
  return 'Behind pace'
}

const PACE_COLOR = { 'Ahead': '#4ade80', 'On track': '#4ade80', 'Behind pace': '#f87171' }

export default function GoalHeroCard({ clientId, onLogWeight, onViewProgress }) {
  const [goal, setGoal] = useState(null)
  const [latestMetric, setLatestMetric] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [goalRes, metricsRes] = await Promise.all([
        supabase.from('client_goals').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_body_metrics').select('measured_at, weight_kg, body_fat_pct')
          .eq('client_id', clientId).order('measured_at', { ascending: false }).limit(50),
      ])
      setGoal(goalRes.data ?? null)
      const allMetrics = metricsRes.data ?? []
      setLatestMetric(allMetrics[0] ?? null)
      setMetrics(allMetrics)
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) return null

  if (!goal) {
    return (
      <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px dashed rgba(74,222,128,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(238,242,238,0.5)', fontSize: 14, margin: 0 }}>
          Set a goal to start tracking your progress
        </p>
        <button
          onClick={onViewProgress}
          style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}
        >
          Set Goal →
        </button>
      </div>
    )
  }

  const { weightProgress, fatProgress } = computeProgress(goal, latestMetric)
  const pace = computePace(goal, weightProgress)
  const streak = computeStreak(metrics)

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        {/* Rings */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <ProgressRing
            progress={weightProgress}
            size={80}
            strokeWidth={7}
            value={latestMetric?.weight_kg ?? goal.goal_weight_kg}
            unit="kg"
            label={`of ${goal.goal_weight_kg}kg`}
          />
          <ProgressRing
            progress={fatProgress}
            size={80}
            strokeWidth={7}
            color="#fbbf24"
            value={latestMetric?.body_fat_pct ?? goal.goal_body_fat_pct}
            unit="%"
            label={`of ${goal.goal_body_fat_pct}% fat`}
          />
        </div>

        {/* Right side: pills + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {streak > 0 && (
              <span style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '4px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#fbbf24' }}>
                {streak}-week streak
              </span>
            )}
            {pace && (
              <span style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${PACE_COLOR[pace]}44`, borderRadius: 20, padding: '4px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: PACE_COLOR[pace] }}>
                {pace}
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.3)', margin: 0 }}>
            {goal.set_by === 'trainer' ? 'Set by your trainer' : 'Your personal goal'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onLogWeight}
              style={{ background: 'none', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
            >
              Log weight
            </button>
            <button
              onClick={onViewProgress}
              style={{ background: 'none', border: '1px solid rgba(238,242,238,0.15)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
            >
              View progress
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
