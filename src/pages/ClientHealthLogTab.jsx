// src/pages/ClientHealthLogTab.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }
const SECTION_TITLE = { color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: 20, marginTop: 0 }
const INPUT_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, padding: '10px 14px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }

// calories burned estimate: steps × 0.0005 × weight_kg (fallback 70kg if no weight)
function estimateCalories(steps, weightKg) {
  const w = weightKg ?? 70
  return Math.round(steps * 0.0005 * w)
}

function MacroBar({ label, eaten, target, color }) {
  const pct = target > 0 ? Math.min(1, eaten / target) : 0
  const over = target > 0 && eaten > target
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.6)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: over ? '#f87171' : '#EEF2EE' }}>
          {eaten}g {target > 0 && <span style={{ color: 'rgba(238,242,238,0.35)', fontWeight: 400 }}>/ {target}g</span>}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: over ? '#f87171' : color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function CalorieSummary({ eaten, target, burned }) {
  const net = eaten - burned
  const remaining = target > 0 ? target - net : null
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
      {[
        { label: 'Eaten', value: eaten, unit: 'kcal', color: '#4ade80' },
        { label: 'Burned (steps)', value: burned, unit: 'kcal', color: '#fbbf24' },
        { label: 'Net', value: net, unit: 'kcal', color: net < 0 ? '#4ade80' : '#EEF2EE' },
        ...(remaining !== null ? [{ label: 'Remaining', value: remaining, unit: 'kcal', color: remaining >= 0 ? '#4ade80' : '#f87171' }] : []),
      ].map(({ label, value, unit, color }) => (
        <div key={label} style={{ flex: '1 1 110px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.08)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
          <p style={{ ...LABEL, marginBottom: 4, textAlign: 'center' }}>{label}</p>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, color, margin: 0 }}>
            {value}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(238,242,238,0.4)', marginLeft: 2 }}>{unit}</span>
          </p>
        </div>
      ))}
    </div>
  )
}

export default function ClientHealthLogTab({ clientId }) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' })
  const [selectedDate, setSelectedDate] = useState(today)

  // Data
  const [target, setTarget] = useState(null)         // client_macro_targets row
  const [nutritionLog, setNutritionLog] = useState(null) // for selectedDate
  const [stepsLog, setStepsLog] = useState(null)     // for selectedDate
  const [latestWeight, setLatestWeight] = useState(null) // from body metrics
  const [loading, setLoading] = useState(true)

  // Nutrition form
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [nutritionError, setNutritionError] = useState(null)
  const [nutritionSaving, setNutritionSaving] = useState(false)

  // Steps form
  const [steps, setSteps] = useState('')
  const [stepsError, setStepsError] = useState(null)
  const [stepsSaving, setStepsSaving] = useState(false)

  // Target form
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [tProtein, setTProtein] = useState('')
  const [tCarbs, setTCarbs] = useState('')
  const [tFats, setTFats] = useState('')
  const [targetSaving, setTargetSaving] = useState(false)
  const [targetError, setTargetError] = useState(null)

  // History
  const [historyOpen, setHistoryOpen] = useState(false)
  const [nutritionHistory, setNutritionHistory] = useState([])
  const [stepsHistory, setStepsHistory] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const [targetRes, nutritionRes, stepsRes, weightRes, nhRes, shRes] = await Promise.all([
      supabase.from('client_macro_targets').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('client_nutrition_logs').select('*').eq('client_id', clientId).eq('logged_date', selectedDate).maybeSingle(),
      supabase.from('client_steps_logs').select('*').eq('client_id', clientId).eq('logged_date', selectedDate).maybeSingle(),
      supabase.from('client_body_metrics').select('weight_kg').eq('client_id', clientId).order('measured_at', { ascending: false }).limit(1),
      supabase.from('client_nutrition_logs').select('logged_date, protein_g, carbs_g, fats_g, calories').eq('client_id', clientId).order('logged_date', { ascending: false }).limit(14),
      supabase.from('client_steps_logs').select('logged_date, steps, calories_burned').eq('client_id', clientId).order('logged_date', { ascending: false }).limit(14),
    ])
    setTarget(targetRes.data ?? null)
    setNutritionLog(nutritionRes.data ?? null)
    setStepsLog(stepsRes.data ?? null)
    setLatestWeight(weightRes.data?.[0]?.weight_kg ?? null)
    setNutritionHistory(nhRes.data ?? [])
    setStepsHistory(shRes.data ?? [])

    // Pre-fill nutrition form
    const n = nutritionRes.data
    setProtein(n ? String(n.protein_g) : '')
    setCarbs(n ? String(n.carbs_g) : '')
    setFats(n ? String(n.fats_g) : '')

    // Pre-fill steps form
    setSteps(stepsRes.data ? String(stepsRes.data.steps) : '')

    setLoading(false)
  }, [clientId, selectedDate])

  useEffect(() => { load() }, [load])

  async function handleNutritionSave(e) {
    e.preventDefault()
    setNutritionError(null)
    const p = parseFloat(protein), c = parseFloat(carbs), f = parseFloat(fats)
    if (isNaN(p) || p < 0 || p > 500) return setNutritionError('Protein must be 0–500g.')
    if (isNaN(c) || c < 0 || c > 1000) return setNutritionError('Carbs must be 0–1000g.')
    if (isNaN(f) || f < 0 || f > 300) return setNutritionError('Fats must be 0–300g.')
    setNutritionSaving(true)
    const { error } = await supabase.from('client_nutrition_logs').upsert({
      client_id: clientId, logged_date: selectedDate,
      protein_g: p, carbs_g: c, fats_g: f,
    }, { onConflict: 'client_id,logged_date' })
    setNutritionSaving(false)
    if (error) return setNutritionError(error.message)
    load()
  }

  async function handleStepsSave(e) {
    e.preventDefault()
    setStepsError(null)
    const s = parseInt(steps, 10)
    if (isNaN(s) || s < 0 || s > 100000) return setStepsError('Steps must be 0–100,000.')
    const cal = estimateCalories(s, latestWeight)
    setStepsSaving(true)
    const { error } = await supabase.from('client_steps_logs').upsert({
      client_id: clientId, logged_date: selectedDate,
      steps: s, calories_burned: cal,
    }, { onConflict: 'client_id,logged_date' })
    setStepsSaving(false)
    if (error) return setStepsError(error.message)
    load()
  }

  async function handleTargetSave(e) {
    e.preventDefault()
    setTargetError(null)
    const p = parseFloat(tProtein), c = parseFloat(tCarbs), f = parseFloat(tFats)
    if (isNaN(p) || p < 0) return setTargetError('Invalid protein target.')
    if (isNaN(c) || c < 0) return setTargetError('Invalid carbs target.')
    if (isNaN(f) || f < 0) return setTargetError('Invalid fats target.')
    setTargetSaving(true)
    const { error } = await supabase.from('client_macro_targets').upsert({
      client_id: clientId, protein_g: p, carbs_g: c, fats_g: f, set_by: 'client',
    }, { onConflict: 'client_id' })
    setTargetSaving(false)
    if (error) return setTargetError(error.message)
    setShowTargetForm(false)
    load()
  }

  function openTargetForm() {
    setTProtein(target ? String(target.protein_g) : '')
    setTCarbs(target ? String(target.carbs_g) : '')
    setTFats(target ? String(target.fats_g) : '')
    setTargetError(null)
    setShowTargetForm(true)
  }

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)' }}>Loading…</p>

  const eaten = nutritionLog ? {
    protein: nutritionLog.protein_g, carbs: nutritionLog.carbs_g,
    fats: nutritionLog.fats_g, calories: nutritionLog.calories,
  } : { protein: 0, carbs: 0, fats: 0, calories: 0 }

  const burned = stepsLog?.calories_burned ?? 0
  const targetCal = target?.calories ?? 0

  return (
    <div>
      {/* Date picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ ...LABEL, marginBottom: 0 }}>Viewing</label>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ ...INPUT_STYLE, width: 'auto' }}
        />
      </div>

      {/* ── Calorie Summary ── */}
      <CalorieSummary eaten={eaten.calories} target={targetCal} burned={burned} />

      {/* ── Nutrition ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ ...SECTION_TITLE, marginBottom: 0 }}>Nutrition</h3>
          <button
            onClick={openTargetForm}
            style={{ background: 'none', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
          >
            {target ? 'Edit target' : 'Set target'}
          </button>
        </div>

        {/* Macro bars */}
        {target ? (
          <>
            <MacroBar label="Protein" eaten={eaten.protein} target={target.protein_g} color="#4ade80" />
            <MacroBar label="Carbs" eaten={eaten.carbs} target={target.carbs_g} color="#60a5fa" />
            <MacroBar label="Fats" eaten={eaten.fats} target={target.fats_g} color="#fbbf24" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(238,242,238,0.3)', margin: '0 0 20px' }}>
              {target.set_by === 'trainer' ? 'Target set by your trainer' : 'Your personal target'} · {target.calories} kcal/day
            </p>
          </>
        ) : (
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 20 }}>
            Set a macro target to track progress against your daily goal.
          </p>
        )}

        {/* Log form */}
        <div style={{ borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 20 }}>
          <p style={{ ...LABEL, marginBottom: 12 }}>Log macros for {selectedDate === today ? 'today' : selectedDate}</p>
          <form onSubmit={handleNutritionSave}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { label: 'Protein (g)', val: protein, set: setProtein, placeholder: 'e.g. 150' },
                { label: 'Carbs (g)', val: carbs, set: setCarbs, placeholder: 'e.g. 200' },
                { label: 'Fats (g)', val: fats, set: setFats, placeholder: 'e.g. 60' },
              ].map(({ label, val, set, placeholder }) => (
                <div key={label} style={{ flex: '1 1 100px' }}>
                  <label style={LABEL}>{label}</label>
                  <input type="number" step="0.1" min="0" placeholder={placeholder} value={val} onChange={e => set(e.target.value)} style={INPUT_STYLE} />
                </div>
              ))}
              <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={nutritionSaving}
                  style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: nutritionSaving ? 'not-allowed' : 'pointer', opacity: nutritionSaving ? 0.6 : 1, whiteSpace: 'nowrap' }}
                >
                  {nutritionSaving ? 'Saving…' : nutritionLog ? 'Update' : 'Log'}
                </button>
              </div>
            </div>
            {protein && carbs && fats && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.4)', margin: '0 0 8px' }}>
                ≈ {Math.round((parseFloat(protein)||0)*4 + (parseFloat(carbs)||0)*4 + (parseFloat(fats)||0)*9)} kcal
              </p>
            )}
            {nutritionError && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>{nutritionError}</p>}
          </form>
        </div>

        {/* Target form (inline) */}
        {showTargetForm && (
          <form onSubmit={handleTargetSave} style={{ marginTop: 20, borderTop: '1px solid rgba(238,242,238,0.08)', paddingTop: 20 }}>
            <p style={{ ...LABEL, marginBottom: 12 }}>Daily macro targets</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {[
                { label: 'Protein (g)', val: tProtein, set: setTProtein },
                { label: 'Carbs (g)', val: tCarbs, set: setTCarbs },
                { label: 'Fats (g)', val: tFats, set: setTFats },
              ].map(({ label, val, set }) => (
                <div key={label} style={{ flex: '1 1 100px' }}>
                  <label style={LABEL}>{label}</label>
                  <input type="number" step="0.1" min="0" value={val} onChange={e => set(e.target.value)} style={INPUT_STYLE} required />
                </div>
              ))}
            </div>
            {tProtein && tCarbs && tFats && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.4)', margin: '0 0 8px' }}>
                ≈ {Math.round((parseFloat(tProtein)||0)*4 + (parseFloat(tCarbs)||0)*4 + (parseFloat(tFats)||0)*9)} kcal/day
              </p>
            )}
            {targetError && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 8px' }}>{targetError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={targetSaving} style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', cursor: targetSaving ? 'not-allowed' : 'pointer', opacity: targetSaving ? 0.6 : 1 }}>
                {targetSaving ? 'Saving…' : 'Save Target'}
              </button>
              <button type="button" onClick={() => setShowTargetForm(false)} style={{ background: 'none', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Steps ── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>Daily Steps</h3>

        {stepsLog ? (
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <p style={{ ...LABEL, marginBottom: 4 }}>Steps</p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, color: '#EEF2EE', margin: 0 }}>
                {stepsLog.steps.toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ ...LABEL, marginBottom: 4 }}>Burned</p>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 32, color: '#fbbf24', margin: 0 }}>
                {stepsLog.calories_burned}<span style={{ fontSize: 14, color: 'rgba(238,242,238,0.4)', fontWeight: 400, marginLeft: 4 }}>kcal</span>
              </p>
            </div>
            {stepsLog.steps >= 10000 && (
              <span style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#4ade80' }}>
                10k goal hit!
              </span>
            )}
          </div>
        ) : (
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, marginBottom: 20 }}>
            No steps logged for this day.
          </p>
        )}

        <form onSubmit={handleStepsSave}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label style={LABEL}>Steps count</label>
              <input
                type="number"
                min="0"
                max="100000"
                step="100"
                placeholder="e.g. 8500"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                style={INPUT_STYLE}
              />
            </div>
            <button
              type="submit"
              disabled={stepsSaving}
              style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: stepsSaving ? 'not-allowed' : 'pointer', opacity: stepsSaving ? 0.6 : 1, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
            >
              {stepsSaving ? 'Saving…' : stepsLog ? 'Update' : 'Log'}
            </button>
          </div>
          {steps && !isNaN(parseInt(steps)) && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(238,242,238,0.4)', marginTop: 6, marginBottom: 0 }}>
              ≈ {estimateCalories(parseInt(steps), latestWeight)} kcal burned
              {latestWeight ? ` (based on ${latestWeight}kg)` : ' (using 70kg estimate — log a weigh-in for accuracy)'}
            </p>
          )}
          {stepsError && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>{stepsError}</p>}
        </form>
      </div>

      {/* ── History ── */}
      {(nutritionHistory.length > 0 || stepsHistory.length > 0) && (
        <div style={CARD}>
          <button
            onClick={() => setHistoryOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span style={{ ...LABEL, marginBottom: 0 }}>Recent history (14 days)</span>
            <span style={{ color: 'rgba(238,242,238,0.4)', fontSize: 12 }}>{historyOpen ? '▲' : '▼'}</span>
          </button>

          {historyOpen && (
            <div style={{ marginTop: 16 }}>
              {/* Nutrition history */}
              {nutritionHistory.length > 0 && (
                <>
                  <p style={{ ...LABEL, marginBottom: 10, color: 'rgba(238,242,238,0.3)' }}>Nutrition</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
                    {nutritionHistory.map((n, i) => (
                      <div key={n.logged_date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < nutritionHistory.length - 1 ? '1px solid rgba(238,242,238,0.06)' : 'none' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.45)' }}>
                          {new Date(n.logged_date + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                        </span>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#4ade80' }}>{n.protein_g}g P</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#60a5fa' }}>{n.carbs_g}g C</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#fbbf24' }}>{n.fats_g}g F</span>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700, color: '#EEF2EE' }}>{n.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Steps history */}
              {stepsHistory.length > 0 && (
                <>
                  <p style={{ ...LABEL, marginBottom: 10, color: 'rgba(238,242,238,0.3)' }}>Steps</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {stepsHistory.map((s, i) => (
                      <div key={s.logged_date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < stepsHistory.length - 1 ? '1px solid rgba(238,242,238,0.06)' : 'none' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(238,242,238,0.45)' }}>
                          {new Date(s.logged_date + 'T00:00:00').toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                        </span>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: '#EEF2EE' }}>{s.steps.toLocaleString()} steps</span>
                          {s.calories_burned != null && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#fbbf24' }}>{s.calories_burned} kcal</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
