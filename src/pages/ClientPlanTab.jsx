// src/pages/ClientPlanTab.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressCharts from '../components/ProgressCharts'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }
const PILL_ACTIVE = { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const PILL_INACTIVE = { background: 'transparent', color: 'rgba(238,242,238,0.4)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }

function computeStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0
  const weekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  }
  const weekSet = new Set(sessions.map(s => weekStart(s.logged_at)))
  let streak = 0
  const checkDate = new Date()
  while (true) {
    const ws = weekStart(checkDate)
    if (weekSet.has(ws)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 7)
    } else {
      break
    }
  }
  return streak
}

export default function ClientPlanTab({ clientId }) {
  const [plan, setPlan] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)
  const [view, setView] = useState('plan')

  useEffect(() => {
    async function load() {
      const [planRes, sessionsRes] = await Promise.all([
        supabase
          .from('client_plans')
          .select('*, client_plan_days(id, day_number, label, is_rest, client_plan_exercises(id, sets, reps, weight_kg, notes, exercises(name, muscle_group, equipment)))')
          .eq('client_id', clientId)
          .eq('status', 'active')
          .single(),
        supabase
          .from('client_sessions')
          .select('id, logged_at')
          .eq('client_id', clientId)
          .order('logged_at', { ascending: false }),
      ])
      setPlan(planRes.data ?? null)
      setSessions(sessionsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading your plan...</p>

  if (!plan) {
    return (
      <div style={CARD}>
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 15, margin: 0 }}>
          No active plan yet. Your trainer will assign one after your first session.
        </p>
      </div>
    )
  }

  const streak = computeStreak(sessions)
  const days = (plan.client_plan_days ?? []).sort((a, b) => a.day_number - b.day_number)
  const nonRestDays = days.filter(d => !d.is_rest).length
  const sessionsLogged = sessions.length
  const totalSessions = plan.total_weeks ? plan.total_weeks * nonRestDays : null
  const progressPct = totalSessions ? Math.min(100, Math.round((sessionsLogged / totalSessions) * 100)) : null

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setView('plan')} style={view === 'plan' ? PILL_ACTIVE : PILL_INACTIVE}>Plan</button>
        <button onClick={() => setView('progress')} style={view === 'progress' ? PILL_ACTIVE : PILL_INACTIVE}>Progress</button>
      </div>
      {view === 'progress' && <ProgressCharts clientId={clientId} />}
      {view === 'plan' && (
        <>
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, margin: '0 0 4px', textTransform: 'uppercase' }}>{plan.name}</p>
                {plan.goal && <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>{plan.goal}</p>}
              </div>
              {streak > 0 && (
                <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '6px 14px' }}>
                  <span style={{ color: '#fbbf24', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>
                    {streak}-week streak
                  </span>
                </div>
              )}
            </div>

            {progressPct !== null && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={LABEL}>Progress</span>
                  <span style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>
                    {sessionsLogged} / {totalSessions} sessions
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: '#4ade80', borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}
          </div>

          <div>
            {days.map(day => (
              <div key={day.id} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
                  style={{ width: '100%', textAlign: 'left', background: expandedDay === day.id ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (expandedDay === day.id ? 'rgba(74,222,128,0.3)' : 'rgba(238,242,238,0.1)'), borderRadius: 10, padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <span style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>{day.label}</span>
                    {day.is_rest && <span style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, marginLeft: 10 }}>Rest</span>}
                    {!day.is_rest && <span style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, marginLeft: 10 }}>{(day.client_plan_exercises ?? []).length} exercises</span>}
                  </div>
                  <span style={{ color: 'rgba(238,242,238,0.4)', fontSize: 16 }}>{expandedDay === day.id ? '▲' : '▼'}</span>
                </button>

                {expandedDay === day.id && !day.is_rest && (
                  <div style={{ border: '1px solid rgba(238,242,238,0.08)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '12px 20px', background: 'rgba(255,255,255,0.02)' }}>
                    {(day.client_plan_exercises ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((ex, i) => (
                      <div key={ex.id} style={{ paddingBottom: 12, borderBottom: i < day.client_plan_exercises.length - 1 ? '1px solid rgba(238,242,238,0.06)' : 'none', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{ex.exercises?.name}</p>
                            <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>{ex.exercises?.muscle_group} · {ex.exercises?.equipment}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>
                              {ex.sets} × {ex.reps}
                            </p>
                            <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>
                              {ex.weight_kg ? `${ex.weight_kg} kg` : 'Bodyweight'}
                            </p>
                          </div>
                        </div>
                        {ex.notes && <p style={{ color: 'rgba(238,242,238,0.45)', fontFamily: 'var(--font-body)', fontSize: 12, margin: '6px 0 0', fontStyle: 'italic' }}>{ex.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
