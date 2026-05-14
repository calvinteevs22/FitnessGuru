// src/components/ProgressCharts.jsx
import { useState, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'

const PILL_ACTIVE = { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const PILL_INACTIVE = { background: 'transparent', color: 'rgba(238,242,238,0.4)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 20, padding: '5px 16px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}

function EmptyState({ message }) {
  return <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>{message}</p>
}

function BodyChart({ clientId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('client_body_metrics')
      .select('measured_at, weight_kg, body_fat_pct')
      .eq('client_id', clientId)
      .order('measured_at', { ascending: true })
      .then(({ data: rows }) => {
        setData((rows ?? []).map(r => ({
          date: formatDate(r.measured_at),
          Weight: r.weight_kg,
          'Body Fat %': r.body_fat_pct,
        })))
        setLoading(false)
      })
  }, [clientId])

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Loading...</p>
  if (data.length < 2) return <EmptyState message="Not enough data yet. Body metrics will appear here after 2+ sessions." />

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,242,238,0.06)" />
        <XAxis dataKey="date" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1a2e1a', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 12 }} />
        <Legend wrapperStyle={{ color: 'rgba(238,242,238,0.5)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
        <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} activeDot={{ r: 5 }} />
        <Line yAxisId="right" type="monotone" dataKey="Body Fat %" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StrengthChart({ clientId }) {
  const [exerciseOptions, setExerciseOptions] = useState([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('session_exercise_logs')
      .select('client_plan_exercise_id, client_plan_exercises(exercise_id, exercises(id, name))')
      .eq('client_sessions.client_id', clientId)
      .order('client_plan_exercise_id')
      .then(({ data: rows }) => {
        const seen = new Set()
        const opts = []
        for (const r of (rows ?? [])) {
          const ex = r.client_plan_exercises?.exercises
          if (ex && !seen.has(ex.id)) {
            seen.add(ex.id)
            opts.push({ id: ex.id, name: ex.name })
          }
        }
        setExerciseOptions(opts)
      })
  }, [clientId])

  useEffect(() => {
    if (!selectedExerciseId) return
    setLoading(true)
    supabase
      .from('session_exercise_logs')
      .select('session_id, actual_reps, actual_weight_kg, is_pr, client_sessions(logged_at, client_id)')
      .eq('client_plan_exercises.exercise_id', selectedExerciseId)
      .order('client_sessions(logged_at)', { ascending: true })
      .then(({ data: rows }) => {
        const bySession = {}
        for (const r of (rows ?? [])) {
          const cs = r.client_sessions
          if (!cs || cs.client_id !== clientId) continue
          const date = formatDate(cs.logged_at)
          if (!bySession[date] || (r.actual_weight_kg ?? 0) > (bySession[date].Weight ?? 0)) {
            bySession[date] = { date, Weight: r.actual_weight_kg, Reps: r.actual_reps, isPR: r.is_pr }
          }
        }
        setData(Object.values(bySession))
        setLoading(false)
      })
  }, [selectedExerciseId, clientId])

  if (exerciseOptions.length === 0) return <EmptyState message="No logged exercises yet. Data appears here after sessions are logged." />

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select style={INPUT} value={selectedExerciseId} onChange={e => setSelectedExerciseId(e.target.value)}>
          <option value="">Select an exercise...</option>
          {exerciseOptions.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>
      {!selectedExerciseId && <EmptyState message="Select an exercise to view progress." />}
      {selectedExerciseId && loading && <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Loading...</p>}
      {selectedExerciseId && !loading && data.length < 2 && <EmptyState message="Not enough data yet. Progress graph appears after 2+ sessions." />}
      {selectedExerciseId && !loading && data.length >= 2 && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,242,238,0.06)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(238,242,238,0.4)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a2e1a', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 12 }}
              formatter={(val, name, props) => [`${val}${name === 'Weight' ? ' kg' : ' reps'}${props.payload?.isPR ? ' 🏆 PR' : ''}`, name]}
            />
            <Legend wrapperStyle={{ color: 'rgba(238,242,238,0.5)', fontSize: 12, fontFamily: 'var(--font-body)' }} />
            <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#4ade80" strokeWidth={2} dot={props => props.payload?.isPR ? <circle cx={props.cx} cy={props.cy} r={6} fill="#fbbf24" stroke="#fbbf24" /> : <circle cx={props.cx} cy={props.cy} r={3} fill="#4ade80" />} activeDot={{ r: 5 }} />
            <Line yAxisId="right" type="monotone" dataKey="Reps" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function ProgressCharts({ clientId }) {
  const [tab, setTab] = useState('body')

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('body')} style={tab === 'body' ? PILL_ACTIVE : PILL_INACTIVE}>Body</button>
        <button onClick={() => setTab('strength')} style={tab === 'strength' ? PILL_ACTIVE : PILL_INACTIVE}>Strength</button>
      </div>
      {tab === 'body' && <BodyChart clientId={clientId} />}
      {tab === 'strength' && <StrengthChart clientId={clientId} />}
    </div>
  )
}
