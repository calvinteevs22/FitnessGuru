// src/components/ExerciseLogger.jsx
import { useState } from 'react'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }
const INPUT_SM = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 6, padding: '8px 10px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', width: '80px', boxSizing: 'border-box' }
const BTN_GREEN = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '10px 20px', fontSize: 14, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const LABEL = { color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }

function ExerciseCard({ ex, logged, onLogSet }) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const loggedSets = logged?.sets ?? []
  const targetSets = ex.sets

  async function handleLog() {
    await onLogSet(ex.id, reps, weight)
    setReps('')
    setWeight('')
  }

  return (
    <div style={CARD}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, margin: '0 0 2px' }}>{ex.exercises?.name}</p>
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>{ex.exercises?.muscle_group} · {ex.exercises?.equipment}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>Target: {ex.sets} × {ex.reps}</p>
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>
            {ex.weight_kg ? `${ex.weight_kg} kg` : 'Bodyweight'}
          </p>
        </div>
      </div>

      {ex.notes && (
        <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 12, fontStyle: 'italic', margin: '0 0 12px' }}>{ex.notes}</p>
      )}

      {loggedSets.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {loggedSets.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700 }}>Set {i + 1}</span>
              <span style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13 }}>
                {s.reps ? `${s.reps} reps` : '—'} {s.weight ? `@ ${s.weight} kg` : ''}
              </span>
              {s.is_pr && <span style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 4, padding: '1px 6px', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>PR</span>}
            </div>
          ))}
        </div>
      )}

      {loggedSets.length < targetSets && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <span style={LABEL}>Reps</span>
            <input style={INPUT_SM} type="number" min="1" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)} />
          </div>
          <div>
            <span style={LABEL}>Weight (kg)</span>
            <input style={INPUT_SM} type="number" min="0" step="0.5" placeholder="kg" value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
          <button onClick={handleLog} style={BTN_GREEN}>Log Set {loggedSets.length + 1}</button>
        </div>
      )}
      {loggedSets.length >= targetSets && (
        <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, margin: 0 }}>All sets logged</p>
      )}
    </div>
  )
}

export default function ExerciseLogger({ day, logs, onLogSet, onFinish }) {
  const exercises = (day.client_plan_exercises ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  return (
    <div>
      <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, textTransform: 'uppercase', margin: '0 0 20px' }}>{day.label}</h2>
      {exercises.map(ex => (
        <ExerciseCard
          key={ex.id}
          ex={ex}
          logged={logs[ex.id]}
          onLogSet={(id, reps, weight) => onLogSet(id, reps, weight)}
        />
      ))}
      <div style={{ marginTop: 20 }}>
        <button onClick={onFinish} style={BTN_GHOST}>Done Logging → Add Notes</button>
      </div>
    </div>
  )
}
