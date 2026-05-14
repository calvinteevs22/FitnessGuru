// src/pages/TrainerPlansTab.jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import ExerciseSearch from '../components/ExerciseSearch'

/* ─── Styles ─────────────────────────────────────────────────── */
const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const INPUT = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '10px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
const BTN_GREEN = { background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_GHOST = { background: 'transparent', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '9px 18px', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_RED = { background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const BTN_SMALL = { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, display: 'block' }
const PILL_ACTIVE = { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const PILL_INACTIVE = { background: 'transparent', color: 'rgba(238,242,238,0.4)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 20, padding: '6px 18px', fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }

/* ─── DayBuilder ─────────────────────────────────────────────── */
function DayBuilder({ day, onUpdate, onRemove }) {
  function addExercise(ex) {
    onUpdate({ ...day, exercises: [...(day.exercises ?? []), { exercise: ex, sets: 3, reps: 10, weight_kg: '', notes: '' }] })
  }

  function updateExercise(idx, field, value) {
    const updated = day.exercises.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    onUpdate({ ...day, exercises: updated })
  }

  function removeExercise(idx) {
    onUpdate({ ...day, exercises: day.exercises.filter((_, i) => i !== idx) })
  }

  function moveExercise(idx, dir) {
    const arr = [...day.exercises]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    onUpdate({ ...day, exercises: arr })
  }

  return (
    <div style={{ border: '1px solid rgba(238,242,238,0.1)', borderRadius: 10, padding: '16px 20px', marginBottom: 12, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <input
          style={{ ...INPUT, flex: 1 }}
          placeholder={`Day ${day.day_number} label...`}
          value={day.label}
          onChange={e => onUpdate({ ...day, label: e.target.value })}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={day.is_rest} onChange={e => onUpdate({ ...day, is_rest: e.target.checked, exercises: [] })} />
          Rest day
        </label>
        <button onClick={onRemove} style={BTN_RED}>Remove</button>
      </div>

      {!day.is_rest && (
        <>
          {(day.exercises ?? []).map((row, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>{row.exercise.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveExercise(idx, -1)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 12 }}>↑</button>
                  <button onClick={() => moveExercise(idx, 1)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 12 }}>↓</button>
                  <button onClick={() => removeExercise(idx)} style={BTN_RED}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={LABEL}>Sets</span>
                  <input style={INPUT} type="number" min="1" value={row.sets} onChange={e => updateExercise(idx, 'sets', parseInt(e.target.value) || 1)} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LABEL}>Reps</span>
                  <input style={INPUT} type="number" min="1" value={row.reps} onChange={e => updateExercise(idx, 'reps', parseInt(e.target.value) || 1)} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={LABEL}>Weight (kg)</span>
                  <input style={INPUT} type="number" min="0" step="0.5" placeholder="BW" value={row.weight_kg} onChange={e => updateExercise(idx, 'weight_kg', e.target.value)} />
                </div>
                <div style={{ flex: 2 }}>
                  <span style={LABEL}>Notes</span>
                  <input style={INPUT} placeholder="Optional..." value={row.notes} onChange={e => updateExercise(idx, 'notes', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <ExerciseSearch onSelect={addExercise} />
          </div>
        </>
      )}
    </div>
  )
}

/* ─── TemplateBuilder ────────────────────────────────────────── */
function TemplateBuilder({ trainerId, existing, onSaved, onCancel }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [goal, setGoal] = useState(existing?.goal ?? '')
  const [days, setDays] = useState(existing?.days ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addDay() {
    setDays(prev => [...prev, { day_number: prev.length + 1, label: `Day ${prev.length + 1}`, is_rest: false, exercises: [] }])
  }

  function updateDay(idx, updated) {
    setDays(prev => prev.map((d, i) => i === idx ? updated : d))
  }

  function removeDay(idx) {
    setDays(prev => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day_number: i + 1 })))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required'); return }
    if (days.length === 0) { setError('Add at least one day'); return }
    setSaving(true)
    setError('')

    const templatePayload = { trainer_id: trainerId, name: name.trim(), goal: goal.trim() || null, day_count: days.length }
    let templateId = existing?.id

    if (existing?.id) {
      await supabase.from('plan_templates').update(templatePayload).eq('id', existing.id)
      await supabase.from('template_days').delete().eq('template_id', existing.id)
    } else {
      const { data } = await supabase.from('plan_templates').insert(templatePayload).select().single()
      templateId = data.id
    }

    for (const day of days) {
      const { data: dayData } = await supabase
        .from('template_days')
        .insert({ template_id: templateId, day_number: day.day_number, label: day.label, is_rest: day.is_rest })
        .select().single()

      for (let i = 0; i < (day.exercises ?? []).length; i++) {
        const row = day.exercises[i]
        await supabase.from('template_exercises').insert({
          day_id: dayData.id,
          exercise_id: row.exercise.id,
          position: i,
          sets: row.sets,
          reps: row.reps,
          weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : null,
          notes: row.notes || null,
        })
      }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div style={CARD}>
      <h3 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>
        {existing ? 'Edit Template' : 'New Template'}
      </h3>
      {error && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 2 }}>
          <span style={LABEL}>Template Name</span>
          <input style={INPUT} placeholder="e.g. 4-Day Push/Pull" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <span style={LABEL}>Goal</span>
          <input style={INPUT} placeholder="e.g. Muscle gain, Fat loss..." value={goal} onChange={e => setGoal(e.target.value)} />
        </div>
      </div>

      {days.map((day, idx) => (
        <DayBuilder key={idx} day={day} onUpdate={updated => updateDay(idx, updated)} onRemove={() => removeDay(idx)} />
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={addDay} style={BTN_SMALL}>+ Add Day</button>
        <button onClick={handleSave} disabled={saving} style={{ ...BTN_GREEN, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Template'}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── TemplatesList ──────────────────────────────────────────── */
function TemplatesList({ trainerId, onEdit }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('plan_templates')
      .select('*, template_days(id, day_number, label, is_rest, template_exercises(id, exercise_id, position, sets, reps, weight_kg, notes, exercises(id, name, muscle_group, equipment)))')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
    setLoading(false)
  }, [trainerId])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!window.confirm('Delete this template? This cannot be undone.')) return
    await supabase.from('plan_templates').delete().eq('id', id)
    load()
  }

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading templates...</p>
  if (templates.length === 0) return <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14 }}>No templates yet. Create your first one.</p>

  return (
    <div>
      {templates.map(t => (
        <div key={t.id} style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>{t.name}</p>
              {t.goal && <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 13, margin: '0 0 4px' }}>{t.goal}</p>}
              <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>{t.day_count} days</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onEdit(t)} style={BTN_SMALL}>Edit</button>
              <button onClick={() => handleDelete(t.id)} style={BTN_RED}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── ClientPlanEditor ───────────────────────────────────────── */
// Reuses DayBuilder. Takes a template, deep-copies into client_plans.
function ClientPlanEditor({ trainerId, client, templates, existingPlan, onSaved, onCancel }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [name, setName] = useState(existingPlan?.name ?? '')
  const [goal, setGoal] = useState(existingPlan?.goal ?? '')
  const [totalWeeks, setTotalWeeks] = useState(existingPlan?.total_weeks ?? '')
  const [days, setDays] = useState(existingPlan?.days ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  async function loadTemplate(templateId) {
    if (!templateId) return
    setLoadingTemplate(true)
    const { data } = await supabase
      .from('plan_templates')
      .select('*, template_days(id, day_number, label, is_rest, template_exercises(id, exercise_id, position, sets, reps, weight_kg, notes, exercises(id, name, muscle_group, equipment)))')
      .eq('id', templateId)
      .single()
    if (data) {
      setName(data.name)
      setGoal(data.goal ?? '')
      const mappedDays = (data.template_days ?? [])
        .sort((a, b) => a.day_number - b.day_number)
        .map(d => ({
          day_number: d.day_number,
          label: d.label,
          is_rest: d.is_rest,
          exercises: (d.template_exercises ?? [])
            .sort((a, b) => a.position - b.position)
            .map(te => ({ exercise: te.exercises, sets: te.sets, reps: te.reps, weight_kg: te.weight_kg ?? '', notes: te.notes ?? '' })),
        }))
      setDays(mappedDays)
    }
    setLoadingTemplate(false)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Plan name is required'); return }
    if (days.length === 0) { setError('Add at least one day'); return }
    setSaving(true)
    setError('')

    const planPayload = {
      trainer_id: trainerId,
      client_id: client.id,
      name: name.trim(),
      goal: goal.trim() || null,
      total_weeks: totalWeeks ? parseInt(totalWeeks) : null,
      status: 'active',
    }

    let planId = existingPlan?.id

    if (existingPlan?.id) {
      await supabase.from('client_plans').update(planPayload).eq('id', existingPlan.id)
      await supabase.from('client_plan_days').delete().eq('plan_id', existingPlan.id)
    } else {
      // Archive any existing active plan for this client
      await supabase.from('client_plans').update({ status: 'archived' }).eq('client_id', client.id).eq('status', 'active')
      const { data } = await supabase.from('client_plans').insert(planPayload).select().single()
      planId = data.id
    }

    for (const day of days) {
      const { data: dayData } = await supabase
        .from('client_plan_days')
        .insert({ plan_id: planId, day_number: day.day_number, label: day.label, is_rest: day.is_rest })
        .select().single()
      for (let i = 0; i < (day.exercises ?? []).length; i++) {
        const row = day.exercises[i]
        await supabase.from('client_plan_exercises').insert({
          day_id: dayData.id,
          exercise_id: row.exercise.id,
          position: i,
          sets: row.sets,
          reps: row.reps,
          weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : null,
          notes: row.notes || null,
        })
      }
    }

    setSaving(false)
    onSaved()
  }

  return (
    <div style={CARD}>
      <h3 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>
        {existingPlan ? 'Edit Plan' : 'Assign Plan'} — {client.full_name}
      </h3>
      {!existingPlan && (
        <div style={{ marginBottom: 20 }}>
          <span style={LABEL}>Start from a template (optional)</span>
          <select
            style={{ ...INPUT, cursor: 'pointer' }}
            value={selectedTemplateId}
            onChange={e => { setSelectedTemplateId(e.target.value); loadTemplate(e.target.value) }}
          >
            <option value="">— Build from scratch —</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {loadingTemplate && <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13, marginTop: 6 }}>Loading template...</p>}
        </div>
      )}
      {error && <p style={{ color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 2 }}>
          <span style={LABEL}>Plan Name</span>
          <input style={INPUT} placeholder="e.g. 8-Week Strength Program" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ flex: 2 }}>
          <span style={LABEL}>Goal</span>
          <input style={INPUT} placeholder="e.g. Build muscle, Lose fat..." value={goal} onChange={e => setGoal(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={LABEL}>Total Weeks</span>
          <input style={INPUT} type="number" min="1" placeholder="e.g. 8" value={totalWeeks} onChange={e => setTotalWeeks(e.target.value)} />
        </div>
      </div>

      {days.map((day, idx) => (
        <DayBuilder key={idx} day={day} onUpdate={updated => setDays(prev => prev.map((d, i) => i === idx ? updated : d))} onRemove={() => setDays(prev => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day_number: i + 1 })))} />
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={() => setDays(prev => [...prev, { day_number: prev.length + 1, label: `Day ${prev.length + 1}`, is_rest: false, exercises: [] }])} style={BTN_SMALL}>+ Add Day</button>
        <button onClick={handleSave} disabled={saving} style={{ ...BTN_GREEN, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── ClientsSection ─────────────────────────────────────────── */
function ClientsSection({ trainerId }) {
  const [clients, setClients] = useState([])
  const [templates, setTemplates] = useState([])
  const [activePlans, setActivePlans] = useState({}) // client_id → plan
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // { client, plan|null }
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      const [bookingsRes, templatesRes, plansRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('client_id, client_name, profiles!bookings_client_id_fkey(id, full_name)')
          .eq('trainer_id', trainerId)
          .in('status', ['confirmed', 'completed'])
          .not('client_id', 'is', null),
        supabase.from('plan_templates').select('id, name').eq('trainer_id', trainerId).order('created_at'),
        supabase
          .from('client_plans')
          .select('*, client_plan_days(id, day_number, label, is_rest, client_plan_exercises(id, exercise_id, position, sets, reps, weight_kg, notes, exercises(id, name, muscle_group, equipment)))')
          .eq('trainer_id', trainerId)
          .eq('status', 'active'),
      ])

      // Deduplicate clients by client_id
      const seen = new Set()
      const uniqueClients = []
      for (const b of (bookingsRes.data ?? [])) {
        if (b.client_id && !seen.has(b.client_id)) {
          seen.add(b.client_id)
          uniqueClients.push({ id: b.client_id, full_name: b.profiles?.full_name ?? b.client_name })
        }
      }

      const plansByClient = {}
      for (const plan of (plansRes.data ?? [])) {
        plansByClient[plan.client_id] = plan
      }

      setClients(uniqueClients)
      setTemplates(templatesRes.data ?? [])
      setActivePlans(plansByClient)
      setLoading(false)
    }
    load()
  }, [trainerId, refreshKey])

  function handleSaved() {
    setEditing(null)
    setRefreshKey(k => k + 1)
  }

  function startEdit(client, existingPlan) {
    if (existingPlan) {
      const days = (existingPlan.client_plan_days ?? [])
        .sort((a, b) => a.day_number - b.day_number)
        .map(d => ({
          day_number: d.day_number,
          label: d.label,
          is_rest: d.is_rest,
          exercises: (d.client_plan_exercises ?? [])
            .sort((a, b) => a.position - b.position)
            .map(ce => ({ exercise: ce.exercises, sets: ce.sets, reps: ce.reps, weight_kg: ce.weight_kg ?? '', notes: ce.notes ?? '' })),
        }))
      setEditing({ client, plan: { ...existingPlan, days } })
    } else {
      setEditing({ client, plan: null })
    }
  }

  if (loading) return <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)' }}>Loading clients...</p>

  if (editing) {
    return (
      <ClientPlanEditor
        trainerId={trainerId}
        client={editing.client}
        templates={templates}
        existingPlan={editing.plan}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    )
  }

  if (clients.length === 0) return <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 14 }}>No clients yet. Clients appear here after a confirmed booking.</p>

  return (
    <div>
      {clients.map(client => {
        const plan = activePlans[client.id]
        return (
          <div key={client.id} style={{ ...CARD, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15, margin: '0 0 4px', textTransform: 'uppercase' }}>{client.full_name}</p>
              <p style={{ color: plan ? '#4ade80' : 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 13, margin: 0 }}>
                {plan ? plan.name : 'No plan assigned'}
              </p>
            </div>
            <button onClick={() => startEdit(client, plan ?? null)} style={plan ? BTN_GHOST : BTN_GREEN}>
              {plan ? 'Edit Plan' : 'Assign Plan'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main TrainerPlansTab ───────────────────────────────────── */
export default function TrainerPlansTab({ trainerId }) {
  const [view, setView] = useState('templates') // 'templates' | 'clients'
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSaved() {
    setShowBuilder(false)
    setEditingTemplate(null)
    setRefreshKey(k => k + 1)
  }

  function handleEdit(template) {
    const days = (template.template_days ?? [])
      .sort((a, b) => a.day_number - b.day_number)
      .map(d => ({
        day_number: d.day_number,
        label: d.label,
        is_rest: d.is_rest,
        exercises: (d.template_exercises ?? [])
          .sort((a, b) => a.position - b.position)
          .map(te => ({
            exercise: te.exercises,
            sets: te.sets,
            reps: te.reps,
            weight_kg: te.weight_kg ?? '',
            notes: te.notes ?? '',
          })),
      }))
    setEditingTemplate({ ...template, days })
    setShowBuilder(true)
  }

  return (
    <div>
      {/* Sub-section switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setView('templates')} style={view === 'templates' ? PILL_ACTIVE : PILL_INACTIVE}>Templates</button>
        <button onClick={() => setView('clients')} style={view === 'clients' ? PILL_ACTIVE : PILL_INACTIVE}>Clients</button>
      </div>

      {view === 'templates' && (
        <>
          {!showBuilder && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => { setEditingTemplate(null); setShowBuilder(true) }} style={BTN_GREEN}>+ New Template</button>
            </div>
          )}
          {showBuilder && (
            <TemplateBuilder
              trainerId={trainerId}
              existing={editingTemplate}
              onSaved={handleSaved}
              onCancel={() => { setShowBuilder(false); setEditingTemplate(null) }}
            />
          )}
          {!showBuilder && <TemplatesList key={refreshKey} trainerId={trainerId} onEdit={handleEdit} />}
        </>
      )}

      {view === 'clients' && (
        <ClientsSection trainerId={trainerId} />
      )}
    </div>
  )
}
