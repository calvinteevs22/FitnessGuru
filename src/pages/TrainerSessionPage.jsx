// src/pages/TrainerSessionPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import ExerciseLogger from '../components/ExerciseLogger'

const PAGE = { minHeight: '100vh', background: '#0d1a0e', padding: '40px 24px' }
const WRAP = { maxWidth: 680, margin: '0 auto' }
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const BTN_GREEN = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' }


export default function TrainerSessionPage() {
  const { bookingId } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)
  const [plan, setPlan] = useState(null)
  const [phase, setPhase] = useState('metrics')
  const [selectedDay, setSelectedDay] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  const [weightKg, setWeightKg] = useState('')
  const [bodyFatPct, setBodyFatPct] = useState('')
  const [savingMetrics, setSavingMetrics] = useState(false)

  const [logs, setLogs] = useState({})
  const [notes, setNotes] = useState('')
  const [ending, setEnding] = useState(false)

  const [clientGoal, setClientGoal] = useState(null)
  const [latestClientMetric, setLatestClientMetric] = useState(null)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [trainerGoalWeight, setTrainerGoalWeight] = useState('')
  const [trainerGoalFat, setTrainerGoalFat] = useState('')
  const [trainerTargetDate, setTrainerTargetDate] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalError, setGoalError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: bk } = await supabase.from('bookings').select('*').eq('id', bookingId).single()
      if (!bk) { setLoading(false); return }
      setBooking(bk)

      const { data: planData } = await supabase
        .from('client_plans')
        .select('*, client_plan_days(id, day_number, label, is_rest, client_plan_exercises(id, sets, reps, weight_kg, notes, exercises(id, name, muscle_group, equipment)))')
        .eq('client_id', bk.client_id)
        .single()

      setPlan(planData ?? null)

      if (bk?.client_id) {
        const [goalRes, metricRes] = await Promise.all([
          supabase.from('client_goals').select('*').eq('client_id', bk.client_id).maybeSingle(),
          supabase.from('client_body_metrics').select('measured_at, weight_kg, body_fat_pct')
            .eq('client_id', bk.client_id).order('measured_at', { ascending: false }).limit(1),
        ])
        setClientGoal(goalRes.data ?? null)
        setLatestClientMetric(metricRes.data?.[0] ?? null)
      }

      setLoading(false)
    }
    load()
  }, [bookingId])

  async function handleSaveMetrics() {
    setSavingMetrics(true)
    const { data: sessionData } = await supabase
      .from('client_sessions')
      .insert({
        client_plan_id: plan.id,
        booking_id: bookingId,
        trainer_id: session.user.id,
        client_id: booking.client_id,
      })
      .select().single()
    setSessionId(sessionData.id)

    if (weightKg || bodyFatPct) {
      await supabase.from('client_body_metrics').insert({
        client_id: booking.client_id,
        trainer_id: session.user.id,
        session_id: sessionData.id,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
      })
    }

    setSavingMetrics(false)
    setPhase('day-select')
  }

  async function handleSkipMetrics() {
    const { data: sessionData } = await supabase
      .from('client_sessions')
      .insert({
        client_plan_id: plan.id,
        booking_id: bookingId,
        trainer_id: session.user.id,
        client_id: booking.client_id,
      })
      .select().single()
    setSessionId(sessionData.id)
    setPhase('day-select')
  }

  async function handleSaveGoal(e) {
    e.preventDefault()
    setGoalError(null)
    const todaySGT = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
    const w = parseFloat(trainerGoalWeight)
    const f = parseFloat(trainerGoalFat)
    if (isNaN(w) || w < 20 || w > 300) return setGoalError('Goal weight must be between 20–300 kg.')
    if (isNaN(f) || f < 1 || f > 60) return setGoalError('Goal body fat % must be between 1–60.')
    if (trainerTargetDate && trainerTargetDate <= todaySGT) return setGoalError('Target date must be in the future.')
    if (!latestClientMetric) return setGoalError('No body metrics on file for this client yet.')
    setSavingGoal(true)
    const isNew = !clientGoal
    const payload = {
      client_id: booking.client_id,
      goal_weight_kg: w,
      goal_body_fat_pct: f,
      target_date: trainerTargetDate || null,
      set_by: 'trainer',
      start_weight_kg: isNew ? latestClientMetric.weight_kg : clientGoal.start_weight_kg,
      start_body_fat_pct: isNew ? (latestClientMetric.body_fat_pct ?? f) : clientGoal.start_body_fat_pct,
    }
    const { data, error } = await supabase.from('client_goals').upsert(payload, { onConflict: 'client_id' }).select().single()
    setSavingGoal(false)
    if (error) return setGoalError(error.message)
    setClientGoal(data)
    setShowGoalForm(false)
  }

  function handleSelectDay(day) {
    setSelectedDay(day)
    const initialLogs = {}
    for (const ex of (day.client_plan_exercises ?? [])) {
      initialLogs[ex.id] = { sets: [] }
    }
    setLogs(initialLogs)
    setPhase('logging')
  }

  async function logSet(exerciseId, reps, weight) {
    const setNumber = (logs[exerciseId]?.sets?.length ?? 0) + 1
    await supabase.from('session_exercise_logs').insert({
      session_id: sessionId,
      client_plan_exercise_id: exerciseId,
      set_number: setNumber,
      actual_reps: reps ? parseInt(reps) : null,
      actual_weight_kg: weight ? parseFloat(weight) : null,
    })
    setLogs(prev => ({
      ...prev,
      [exerciseId]: { sets: [...(prev[exerciseId]?.sets ?? []), { reps, weight }] },
    }))
  }

  async function handleEndSession() {
    setEnding(true)
    await supabase.from('client_sessions').update({ trainer_notes: notes || null }).eq('id', sessionId)
    setEnding(false)
    navigate('/dashboard/trainer')
  }

  if (loading) {
    return (
      <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)' }}>Loading session...</p>
      </div>
    )
  }

  if (!booking || !plan) {
    return (
      <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: '#f87171', fontFamily: 'var(--font-body)' }}>
          {!booking ? 'Booking not found.' : 'This client has no active plan. Assign one first.'}
        </p>
        <button onClick={() => navigate('/dashboard/trainer')} style={BTN_GHOST}>Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div style={PAGE}>
      <div style={WRAP}>
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => navigate('/dashboard/trainer')} style={{ background: 'none', border: 'none', color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer', padding: 0 }}>
            ← Back to Dashboard
          </button>
          <h1 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', margin: '8px 0 4px' }}>
            Session — {booking.client_name}
          </h1>
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
            {plan.name}
          </p>
        </div>

        {phase === 'metrics' && (
          <div style={CARD}>
            <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Pre-Session Check-In</h2>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: '0 0 20px' }}>Measure and record before the workout starts.</p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <span style={LABEL}>Body Weight (kg)</span>
                <input style={INPUT} type="number" step="0.1" placeholder="e.g. 72.5" value={weightKg} onChange={e => setWeightKg(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={LABEL}>Body Fat %</span>
                <input style={INPUT} type="number" step="0.1" placeholder="e.g. 18.5" value={bodyFatPct} onChange={e => setBodyFatPct(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveMetrics} disabled={savingMetrics} style={{ ...BTN_GREEN, opacity: savingMetrics ? 0.6 : 1 }}>
                {savingMetrics ? 'Saving...' : 'Save & Continue'}
              </button>
              <button onClick={handleSkipMetrics} style={BTN_GHOST}>Skip for now</button>
            </div>
          </div>
        )}

        {(phase === 'day-select' || phase === 'logging') && (
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: clientGoal && !showGoalForm ? 16 : 0 }}>
              <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, margin: 0 }}>Client Goal</h2>
              <button
                onClick={() => {
                  if (clientGoal) {
                    setTrainerGoalWeight(String(clientGoal.goal_weight_kg))
                    setTrainerGoalFat(String(clientGoal.goal_body_fat_pct))
                    setTrainerTargetDate(clientGoal.target_date ?? '')
                  } else {
                    setTrainerGoalWeight('')
                    setTrainerGoalFat('')
                    setTrainerTargetDate('')
                  }
                  setGoalError(null)
                  setShowGoalForm(v => !v)
                }}
                style={{ ...BTN_GHOST, fontSize: 12, padding: '6px 14px' }}
              >
                {clientGoal ? 'Edit Goal' : 'Set Goal'}
              </button>
            </div>
            {clientGoal && !showGoalForm && (
              <div style={{ color: 'rgba(238,242,238,0.6)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                <p style={{ margin: '0 0 4px' }}>
                  Target: <span style={{ color: '#EEF2EE', fontWeight: 700 }}>{clientGoal.goal_weight_kg}kg · {clientGoal.goal_body_fat_pct}% body fat</span>
                </p>
                {clientGoal.target_date && (
                  <p style={{ margin: 0 }}>By {new Date(clientGoal.target_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
            )}
            {showGoalForm && (
              <form onSubmit={handleSaveGoal} style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ flex: '1 1 130px' }}>
                    <span style={LABEL}>Target Weight (kg) *</span>
                    <input type="number" step="0.1" placeholder="e.g. 70.0" value={trainerGoalWeight} onChange={e => setTrainerGoalWeight(e.target.value)} style={INPUT} required />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
                    <span style={LABEL}>Target Body Fat % *</span>
                    <input type="number" step="0.1" placeholder="e.g. 15.0" value={trainerGoalFat} onChange={e => setTrainerGoalFat(e.target.value)} style={INPUT} required />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <span style={LABEL}>Target Date (optional)</span>
                    <input type="date" value={trainerTargetDate} onChange={e => setTrainerTargetDate(e.target.value)} style={INPUT} />
                  </div>
                </div>
                {goalError && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 12px' }}>{goalError}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={savingGoal} style={{ ...BTN_GREEN, opacity: savingGoal ? 0.6 : 1, fontSize: 13 }}>
                    {savingGoal ? 'Saving…' : 'Save Goal'}
                  </button>
                  <button type="button" onClick={() => setShowGoalForm(false)} style={BTN_GHOST}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        {phase === 'day-select' && (
          <div style={CARD}>
            <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Select Today's Day</h2>
            {(plan.client_plan_days ?? [])
              .sort((a, b) => a.day_number - b.day_number)
              .filter(d => !d.is_rest)
              .map(day => (
                <button
                  key={day.id}
                  onClick={() => handleSelectDay(day)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 8, padding: '14px 18px', marginBottom: 8, cursor: 'pointer', color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}
                >
                  {day.label} <span style={{ color: 'rgba(238,242,238,0.35)', fontSize: 12, fontWeight: 400, fontFamily: 'var(--font-body)' }}>— {(day.client_plan_exercises ?? []).length} exercises</span>
                </button>
              ))}
          </div>
        )}

        {phase === 'logging' && selectedDay && (
          <ExerciseLogger
            day={selectedDay}
            logs={logs}
            onLogSet={logSet}
            onFinish={() => setPhase('notes')}
          />
        )}

        {phase === 'notes' && (
          <div style={CARD}>
            <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Session Notes</h2>
            <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: '0 0 16px' }}>Add any observations about today's session (optional).</p>
            <textarea
              style={{ ...INPUT, height: 120, resize: 'vertical' }}
              placeholder="e.g. Client struggled with squats, reduced weight. Good energy overall."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={handleEndSession} disabled={ending} style={{ ...BTN_GREEN, opacity: ending ? 0.6 : 1 }}>
                {ending ? 'Ending...' : 'End Session'}
              </button>
              <button onClick={() => setPhase('logging')} style={BTN_GHOST}>Back to Logging</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
