// src/pages/ClientProgressTab.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { supabase } from '../lib/supabase'
import GoalDetailCard from '../components/GoalDetailCard'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }
const SECTION_TITLE = { color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 16, marginTop: 0 }
const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)',
  borderRadius: 8, padding: '10px 14px', color: '#EEF2EE',
  fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%',
  boxSizing: 'border-box',
}

const TIME_RANGES = ['4W', '3M', '6M', 'All']

function filterByRange(data, range, dateKey = 'measured_at') {
  if (range === 'All') return data
  const now = new Date()
  const cutoff = new Date(now)
  if (range === '4W') cutoff.setDate(now.getDate() - 28)
  else if (range === '3M') cutoff.setMonth(now.getMonth() - 3)
  else if (range === '6M') cutoff.setMonth(now.getMonth() - 6)
  return data.filter(d => new Date(d[dateKey]) >= cutoff)
}

function RangePills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      {TIME_RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
            background: value === r ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
            color: value === r ? '#4ade80' : 'rgba(238,242,238,0.5)',
            borderBottom: value === r ? '2px solid #4ade80' : '2px solid transparent',
            transition: 'all 0.15s',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14, margin: '20px 0', textAlign: 'center' }}>
      {text}
    </p>
  )
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, delta, deltaLabel }) {
  const deltaColor = delta === null ? 'rgba(238,242,238,0.4)' : delta < 0 ? '#4ade80' : delta > 0 ? '#f87171' : 'rgba(238,242,238,0.4)'
  const deltaSign = delta === null ? '—' : delta < 0 ? `↓ ${Math.abs(delta).toFixed(1)}` : delta > 0 ? `↑ ${delta.toFixed(1)}` : '→ 0'
  return (
    <div style={{ ...CARD, flex: 1, minWidth: 140, marginBottom: 0 }}>
      <p style={{ ...LABEL, marginBottom: 8, marginTop: 0 }}>{label}</p>
      <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, margin: '0 0 4px' }}>
        {value}<span style={{ fontSize: 16, fontWeight: 600, marginLeft: 4, color: 'rgba(238,242,238,0.6)' }}>{unit}</span>
      </p>
      <p style={{ color: deltaColor, fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
        {deltaSign} <span style={{ color: 'rgba(238,242,238,0.3)', fontWeight: 400 }}>{deltaLabel}</span>
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientProgressTab({ clientId }) {
  const [metrics, setMetrics] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [goal, setGoal] = useState(null)
  const [bodyRange, setBodyRange] = useState('3M')

  // Log form
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  const [logDate, setLogDate] = useState(today)
  const [logWeight, setLogWeight] = useState('')
  const [logFat, setLogFat] = useState('')
  const [logError, setLogError] = useState(null)
  const [logSubmitting, setLogSubmitting] = useState(false)

  // Strength
  const [sessions, setSessions] = useState([])
  const [exerciseLogs, setExerciseLogs] = useState([])
  const [exerciseNames, setExerciseNames] = useState({}) // exerciseId -> name
  const [selectedExercise, setSelectedExercise] = useState('')
  const [strengthRange, setStrengthRange] = useState('3M')
  const [strengthLoading, setStrengthLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true)
    const [metricsRes, goalRes] = await Promise.all([
      supabase
        .from('client_body_metrics')
        .select('id, measured_at, weight_kg, body_fat_pct')
        .eq('client_id', clientId)
        .order('measured_at', { ascending: true }),
      supabase
        .from('client_goals')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle(),
    ])
    setMetrics(metricsRes.data ?? [])
    setGoal(goalRes.data ?? null)
    setMetricsLoading(false)
  }, [clientId])

  const fetchStrength = useCallback(async () => {
    setStrengthLoading(true)
    const { data: sessionsData } = await supabase
      .from('client_sessions')
      .select('id, logged_at')
      .eq('client_id', clientId)

    const sessionList = sessionsData ?? []
    setSessions(sessionList)

    if (sessionList.length === 0) {
      setExerciseLogs([])
      setStrengthLoading(false)
      return
    }

    const sessionIds = sessionList.map(s => s.id)
    const { data: logs } = await supabase
      .from('session_exercise_logs')
      .select('session_id, actual_reps, actual_weight_kg, is_pr, client_plan_exercise_id, client_plan_exercises(exercise_id, exercises(id, name))')
      .in('session_id', sessionIds)

    const logList = logs ?? []
    setExerciseLogs(logList)

    // Build exercise name map
    const nameMap = {}
    logList.forEach(l => {
      const ex = l.client_plan_exercises?.exercises
      if (ex) nameMap[ex.id] = ex.name
    })
    setExerciseNames(nameMap)

    // Default to first exercise
    const ids = Object.keys(nameMap)
    if (ids.length > 0) setSelectedExercise(ids[0])

    setStrengthLoading(false)
  }, [clientId])

  useEffect(() => {
    fetchMetrics()
    fetchStrength()
  }, [fetchMetrics, fetchStrength])

  // ── Derived: body metrics ──────────────────────────────────────────────────
  const hasFat = metrics.some(m => m.body_fat_pct != null)
  const latest = metrics[metrics.length - 1]
  const prev = metrics.length >= 2 ? metrics[metrics.length - 2] : null
  const weightDelta = latest && prev ? latest.weight_kg - prev.weight_kg : null
  const fatDelta = latest?.body_fat_pct != null && prev?.body_fat_pct != null
    ? latest.body_fat_pct - prev.body_fat_pct : null

  const filteredMetrics = filterByRange(metrics, bodyRange)
  const chartData = filteredMetrics.map(m => ({
    date: new Date(m.measured_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
    weight: m.weight_kg,
    fat: m.body_fat_pct ?? null,
  }))

  // ── Derived: strength ──────────────────────────────────────────────────────
  const sessionMap = Object.fromEntries(sessions.map(s => [s.id, s.logged_at]))

  const exerciseOptions = Object.entries(exerciseNames).map(([id, name]) => ({ id, name }))

  const strengthData = (() => {
    if (!selectedExercise) return []
    const bySession = {}
    exerciseLogs
      .filter(l => l.client_plan_exercises?.exercises?.id === selectedExercise)
      .forEach(l => {
        if (!bySession[l.session_id]) {
          bySession[l.session_id] = { date: sessionMap[l.session_id], volume: 0, pr: false }
        }
        bySession[l.session_id].volume += (l.actual_weight_kg ?? 0) * (l.actual_reps ?? 0)
        if (l.is_pr) bySession[l.session_id].pr = true
      })
    return Object.values(bySession)
      .filter(d => d.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        date: new Date(d.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }),
        volume: Math.round(d.volume),
        pr: d.pr,
        rawDate: d.date,
      }))
  })()

  const filteredStrength = filterByRange(strengthData, strengthRange, 'rawDate')

  // ── Log submit ─────────────────────────────────────────────────────────────
  async function handleLog(e) {
    e.preventDefault()
    setLogError(null)
    const w = parseFloat(logWeight)
    const f = logFat !== '' ? parseFloat(logFat) : null
    if (!logDate) return setLogError('Date is required.')
    if (isNaN(w) || w < 20 || w > 300) return setLogError('Weight must be between 20–300 kg.')
    if (f !== null && (isNaN(f) || f < 1 || f > 70)) return setLogError('Body fat % must be between 1–70.')
    setLogSubmitting(true)
    const measured_at = new Date(logDate + 'T00:00:00+08:00').toISOString()
    const { error } = await supabase.from('client_body_metrics').insert({
      client_id: clientId,
      measured_at,
      weight_kg: w,
      body_fat_pct: f,
    })
    setLogSubmitting(false)
    if (error) return setLogError(error.message)
    setLogWeight('')
    setLogFat('')
    setLogDate(today)
    fetchMetrics()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (metricsLoading || strengthLoading) {
    return <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)' }}>Loading progress...</p>
  }

  return (
    <div>
      {/* ── Goal Detail Card ── */}
      <GoalDetailCard clientId={clientId} />

      {/* ── Section 1: Stats Row ── */}
      {metrics.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center' }}>
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 15, margin: 0 }}>
            Log your first weigh-in below to start tracking progress.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard
            label="Body Weight"
            value={latest.weight_kg}
            unit="kg"
            delta={weightDelta}
            deltaLabel="vs prev entry"
          />
          {hasFat && latest.body_fat_pct != null && (
            <StatCard
              label="Body Fat"
              value={latest.body_fat_pct}
              unit="%"
              delta={fatDelta}
              deltaLabel="vs prev entry"
            />
          )}
        </div>
      )}

      {/* ── Section 2: Body Metrics ── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Body Metrics</h3>
        <RangePills value={bodyRange} onChange={setBodyRange} />

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: hasFat ? 20 : 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              <YAxis yAxisId="left" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11, fontFamily: 'var(--font-body)' }} domain={['auto', 'auto']} />
              {hasFat && (
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11, fontFamily: 'var(--font-body)' }} domain={['auto', 'auto']} />
              )}
              <Tooltip
                contentStyle={{ background: '#111d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}
                labelStyle={{ color: '#EEF2EE' }}
              />
              {(metrics.length > 0 && hasFat) && <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.5)' }} />}
              <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#4ade80" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              {hasFat && (
                <Line yAxisId="right" type="monotone" dataKey="fat" name="Body Fat %" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
              )}
              {goal?.goal_weight_kg && (
                <ReferenceLine yAxisId="left" y={goal.goal_weight_kg} stroke="rgba(74,222,128,0.4)" strokeDasharray="6 3" label={{ value: 'Goal', fill: 'rgba(74,222,128,0.5)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              )}
              {goal?.goal_body_fat_pct && hasFat && (
                <ReferenceLine yAxisId="right" y={goal.goal_body_fat_pct} stroke="rgba(251,191,36,0.4)" strokeDasharray="6 3" label={{ value: 'Goal', fill: 'rgba(251,191,36,0.5)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState text={metrics.length === 0 ? 'Log a weigh-in below to see your chart.' : 'Log at least 2 entries to see your trend.'} />
        )}

        {/* Log form */}
        <div style={{ marginTop: 24, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 20 }}>
          <p style={{ ...LABEL, marginBottom: 12, marginTop: 0 }}>Log weigh-in</p>
          <form onSubmit={handleLog}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 130px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: 6 }}>Date</label>
                <input
                  type="date"
                  value={logDate}
                  max={today}
                  onChange={e => setLogDate(e.target.value)}
                  style={INPUT_STYLE}
                  required
                />
              </div>
              <div style={{ flex: '1 1 110px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: 6 }}>Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 75.5"
                  value={logWeight}
                  onChange={e => setLogWeight(e.target.value)}
                  style={INPUT_STYLE}
                  required
                />
              </div>
              <div style={{ flex: '1 1 110px' }}>
                <label style={{ ...LABEL, display: 'block', marginBottom: 6 }}>Body Fat % (opt)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 18.0"
                  value={logFat}
                  onChange={e => setLogFat(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <button
                type="submit"
                disabled={logSubmitting}
                style={{
                  background: '#4ade80', color: '#0d1a0e',
                  border: 'none', borderRadius: 8, padding: '10px 22px',
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: logSubmitting ? 'not-allowed' : 'pointer',
                  opacity: logSubmitting ? 0.6 : 1,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  alignSelf: 'flex-end',
                }}
              >
                {logSubmitting ? 'Saving…' : 'Log'}
              </button>
            </div>
            {logError && (
              <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                {logError}
              </p>
            )}
          </form>
        </div>

        {/* History log */}
        {metrics.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 20 }}>
            <p style={{ ...LABEL, marginBottom: 12, marginTop: 0 }}>Log history</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[...metrics].reverse().map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < metrics.length - 1 ? '1px solid rgba(238,242,238,0.06)' : 'none',
                }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.45)' }}>
                    {new Date(m.measured_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Singapore' })}
                  </span>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#EEF2EE' }}>
                      {m.weight_kg} <span style={{ color: 'rgba(238,242,238,0.4)', fontWeight: 400 }}>kg</span>
                    </span>
                    {m.body_fat_pct != null && (
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#EEF2EE' }}>
                        {m.body_fat_pct} <span style={{ color: 'rgba(238,242,238,0.4)', fontWeight: 400 }}>%</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Strength Progress ── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Strength Progress</h3>

        {sessions.length === 0 ? (
          <EmptyState text="No exercise data yet. Your trainer logs strength data during sessions." />
        ) : exerciseOptions.length === 0 ? (
          <EmptyState text="No exercise data yet. Your trainer logs strength data during sessions." />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <select
                value={selectedExercise}
                onChange={e => setSelectedExercise(e.target.value)}
                style={{ ...INPUT_STYLE, width: 'auto', flex: '1 1 200px', cursor: 'pointer' }}
              >
                {exerciseOptions.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>

            <RangePills value={strengthRange} onChange={setStrengthRange} />

            {filteredStrength.length < 2 ? (
              <EmptyState text="Not enough data yet — keep training!" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={filteredStrength} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
                  <YAxis tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
                  <Tooltip
                    contentStyle={{ background: '#111d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'var(--font-body)', fontSize: 13 }}
                    labelStyle={{ color: '#EEF2EE' }}
                    formatter={(v, n) => [`${v} kg`, 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                    {filteredStrength.map((entry, i) => (
                      <Cell key={i} fill={entry.pr ? '#fbbf24' : '#4ade80'} fillOpacity={entry.pr ? 1 : 0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {filteredStrength.some(d => d.pr) && (
              <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, marginTop: 10, marginBottom: 0 }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>■</span> Gold bars = personal record set during that session
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
