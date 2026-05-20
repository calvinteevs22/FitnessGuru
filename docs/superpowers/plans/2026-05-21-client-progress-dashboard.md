# Client Progress Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "My Progress" tab to the client dashboard with body metrics tracking (client-loggable) and strength volume charts (trainer-logged, client-viewed).

**Architecture:** New `ClientProgressTab.jsx` page component handles all progress UI. `ClientPlanTab.jsx` loses its progress sub-view. `ClientDashboardPage.jsx` gains a third tab. One migration adds the missing client INSERT RLS policy.

**Tech Stack:** React 19, recharts (already installed), Supabase JS client, inline styles matching existing app patterns.

---

### Task 1: Add client INSERT RLS policy on client_body_metrics

**Files:**
- Create: `supabase/migrations/20260521000000_client_body_metrics_insert_rls.sql`

Context: The SELECT policy already exists ("Client reads their own body metrics"). Trainer has ALL. We only need INSERT for clients.

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260521000000_client_body_metrics_insert_rls.sql
CREATE POLICY "clients can insert own body metrics"
ON client_body_metrics FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());
```

- [ ] **Step 2: Apply migration to remote**

```bash
SUPABASE_ACCESS_TOKEN=<your-supabase-pat> \
  npx supabase db push --project-ref wnwmlaqhyztwxyvzuqpe
```

Expected: migration applied without errors.

- [ ] **Step 3: Verify policy exists**

```bash
SUPABASE_ACCESS_TOKEN=<your-supabase-pat> \
  npx supabase db query --linked \
  "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'client_body_metrics';"
```

Expected: 3 rows — SELECT (client), ALL (trainer), INSERT (client).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260521000000_client_body_metrics_insert_rls.sql
git commit -m "feat: add client INSERT RLS policy on client_body_metrics"
```

---

### Task 2: Strip progress sub-view from ClientPlanTab

**Files:**
- Modify: `src/pages/ClientPlanTab.jsx`

Remove: `ProgressCharts` import, `view` state, Plan/Progress sub-pills, the `view === 'progress'` render branch. My Plan always shows the plan.

- [ ] **Step 1: Edit ClientPlanTab.jsx**

Replace the entire file content with:

```jsx
// src/pages/ClientPlanTab.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }

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
    if (weekSet.has(ws)) { streak++; checkDate.setDate(checkDate.getDate() - 7) }
    else break
  }
  return streak
}

export default function ClientPlanTab({ clientId }) {
  const [plan, setPlan] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState(null)

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
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 22, margin: '0 0 4px', textTransform: 'uppercase' }}>{plan.name}</p>
            {plan.goal && <p style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 14, margin: 0 }}>{plan.goal}</p>}
          </div>
          {streak > 0 && (
            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '6px 14px' }}>
              <span style={{ color: '#fbbf24', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13 }}>{streak}-week streak</span>
            </div>
          )}
        </div>
        {progressPct !== null && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={LABEL}>Progress</span>
              <span style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700 }}>{sessionsLogged} / {totalSessions} sessions</span>
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
                        <p style={{ color: '#4ade80', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, margin: '0 0 2px' }}>{ex.sets} × {ex.reps}</p>
                        <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 12, margin: 0 }}>{ex.weight_kg ? `${ex.weight_kg} kg` : 'Bodyweight'}</p>
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
    </div>
  )
}
```

- [ ] **Step 2: Verify app loads without errors**

Run: `npm run dev` (or confirm dev server is running). Navigate to `/dashboard/client` → My Plan. Plan should render with no console errors. Progress sub-pill should be gone.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ClientPlanTab.jsx
git commit -m "refactor: remove progress sub-view from ClientPlanTab"
```

---

### Task 3: Add My Progress tab to ClientDashboardPage

**Files:**
- Modify: `src/pages/ClientDashboardPage.jsx`

- [ ] **Step 1: Add import and tab entry**

At the top of `ClientDashboardPage.jsx`, add the import after the `ClientPlanTab` import:
```js
import ClientProgressTab from './ClientProgressTab'
```

Change `CLIENT_TABS` from:
```js
const CLIENT_TABS = [
  { key: 'bookings', label: 'My Bookings' },
  { key: 'plan', label: 'My Plan' },
]
```
to:
```js
const CLIENT_TABS = [
  { key: 'bookings', label: 'My Bookings' },
  { key: 'plan', label: 'My Plan' },
  { key: 'progress', label: 'My Progress' },
]
```

- [ ] **Step 2: Render the tab**

Find the block that renders `activeTab === 'plan'` content and add below it:
```jsx
{activeTab === 'progress' && (
  <ClientProgressTab clientId={session.user.id} />
)}
```

- [ ] **Step 3: Create stub ClientProgressTab so the app compiles**

Create `src/pages/ClientProgressTab.jsx` with a stub (full implementation comes in Task 4):
```jsx
// src/pages/ClientProgressTab.jsx
export default function ClientProgressTab({ clientId }) {
  return (
    <div style={{ color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', padding: '40px 0', textAlign: 'center' }}>
      Loading progress...
    </div>
  )
}
```

- [ ] **Step 4: Verify tab appears and is clickable**

Navigate to `/dashboard/client`. Three tabs should appear: My Bookings · My Plan · My Progress. Clicking My Progress shows the stub text.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ClientDashboardPage.jsx src/pages/ClientProgressTab.jsx
git commit -m "feat: add My Progress tab to client dashboard"
```

---

### Task 4: Implement ClientProgressTab — Stats Row + Body Metrics Chart

**Files:**
- Modify: `src/pages/ClientProgressTab.jsx`

- [ ] **Step 1: Replace stub with full body metrics implementation**

```jsx
// src/pages/ClientProgressTab.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'

const CARD = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }
const LABEL = { color: 'rgba(238,242,238,0.5)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }
const PILL_ACTIVE = { background: 'rgba(74,222,128,0.12)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const PILL_INACTIVE = { background: 'transparent', color: 'rgba(238,242,238,0.4)', border: '1px solid rgba(238,242,238,0.1)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }
const INPUT_STYLE = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(238,242,238,0.2)', borderRadius: 6, padding: '8px 12px', color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

const RANGES = { '4W': 28, '3M': 90, '6M': 180, 'All': Infinity }

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function filterByRange(data, days, dateKey = 'date') {
  if (days === Infinity) return data
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return data.filter(d => new Date(d[dateKey]) >= cutoff)
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })
}

function Delta({ value, greenWhenDown = true }) {
  if (value == null || value === 0) return <span style={{ color: 'rgba(238,242,238,0.4)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  const isGood = greenWhenDown ? value < 0 : value > 0
  const color = isGood ? '#4ade80' : '#f87171'
  const arrow = value > 0 ? '↑' : '↓'
  return <span style={{ color, fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700 }}>{arrow} {Math.abs(value).toFixed(1)}</span>
}

function StatCard({ label, value, unit, delta, greenWhenDown = true, hidden }) {
  if (hidden) return null
  return (
    <div style={{ ...CARD, flex: 1, minWidth: 140, marginBottom: 0 }}>
      <p style={{ ...LABEL, marginBottom: 6 }}>{label}</p>
      <p style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 28, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
        {value != null ? value : '—'}<span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(238,242,238,0.5)', marginLeft: 4 }}>{unit}</span>
      </p>
      {delta != null && <Delta value={delta} greenWhenDown={greenWhenDown} />}
    </div>
  )
}

export default function ClientProgressTab({ clientId }) {
  const [metrics, setMetrics] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [bodyRange, setBodyRange] = useState('3M')

  // Log form state
  const [logDate, setLogDate] = useState(todayISO())
  const [logWeight, setLogWeight] = useState('')
  const [logFat, setLogFat] = useState('')
  const [logError, setLogError] = useState(null)
  const [logSaving, setLogSaving] = useState(false)

  // Strength state — Task 5
  const [sessions, setSessions] = useState([])
  const [exerciseLogs, setExerciseLogs] = useState([])
  const [strengthRange, setStrengthRange] = useState('3M')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [strengthLoading, setStrengthLoading] = useState(true)

  async function fetchMetrics() {
    const { data } = await supabase
      .from('client_body_metrics')
      .select('measured_at, weight_kg, body_fat_pct')
      .eq('client_id', clientId)
      .order('measured_at', { ascending: true })
    setMetrics(data ?? [])
    setMetricsLoading(false)
  }

  async function fetchStrength() {
    const { data: sess } = await supabase
      .from('client_sessions')
      .select('id, logged_at')
      .eq('client_id', clientId)
      .order('logged_at', { ascending: true })
    const sessionList = sess ?? []
    setSessions(sessionList)

    if (sessionList.length === 0) { setStrengthLoading(false); return }

    const ids = sessionList.map(s => s.id)
    const { data: logs } = await supabase
      .from('session_exercise_logs')
      .select('session_id, actual_reps, actual_weight_kg, is_pr, client_plan_exercise_id, client_plan_exercises(exercise_id, exercises(id, name))')
      .in('session_id', ids)
    setExerciseLogs(logs ?? [])
    setStrengthLoading(false)
  }

  useEffect(() => {
    fetchMetrics()
    fetchStrength()
  }, [clientId])

  async function handleLog(e) {
    e.preventDefault()
    setLogError(null)
    const w = parseFloat(logWeight)
    const f = logFat !== '' ? parseFloat(logFat) : null
    if (isNaN(w) || w < 20 || w > 300) { setLogError('Weight must be between 20 and 300 kg.'); return }
    if (f !== null && (isNaN(f) || f < 1 || f > 70)) { setLogError('Body fat % must be between 1 and 70.'); return }
    if (!logDate) { setLogError('Please select a date.'); return }

    // Convert selected date (YYYY-MM-DD) to SGT midnight → UTC ISO string
    const measuredAt = new Date(logDate + 'T00:00:00+08:00').toISOString()

    setLogSaving(true)
    const { error } = await supabase.from('client_body_metrics').insert({
      client_id: clientId,
      measured_at: measuredAt,
      weight_kg: w,
      body_fat_pct: f,
    })
    setLogSaving(false)
    if (error) { setLogError(error.message); return }
    setLogWeight('')
    setLogFat('')
    setLogDate(todayISO())
    fetchMetrics()
  }

  // Derived body chart data
  const chartData = metrics.map(r => ({
    date: r.measured_at,
    dateLabel: formatDate(r.measured_at),
    weight: r.weight_kg != null ? Number(r.weight_kg) : null,
    fat: r.body_fat_pct != null ? Number(r.body_fat_pct) : null,
  }))
  const filteredBodyData = filterByRange(chartData, RANGES[bodyRange], 'date')
  const hasFat = metrics.some(r => r.body_fat_pct != null)

  // Stats row
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null
  const prev = metrics.length > 1 ? metrics[metrics.length - 2] : null
  const weightDelta = latest && prev && latest.weight_kg != null && prev.weight_kg != null
    ? Number(latest.weight_kg) - Number(prev.weight_kg) : null
  const fatDelta = latest && prev && latest.body_fat_pct != null && prev.body_fat_pct != null
    ? Number(latest.body_fat_pct) - Number(prev.body_fat_pct) : null

  // Strength: build exercise options + volume data
  const exerciseMap = {} // exerciseId → { id, name }
  for (const log of exerciseLogs) {
    const ex = log.client_plan_exercises?.exercises
    if (ex && !exerciseMap[ex.id]) exerciseMap[ex.id] = { id: ex.id, name: ex.name }
  }
  const exerciseOptions = Object.values(exerciseMap)

  const sessionDateMap = {} // sessionId → logged_at
  for (const s of sessions) sessionDateMap[s.id] = s.logged_at

  // Compute volume per session for selected exercise
  const strengthData = (() => {
    if (!selectedExerciseId) return []
    const bySession = {}
    for (const log of exerciseLogs) {
      const exId = log.client_plan_exercises?.exercises?.id
      if (exId !== selectedExerciseId) continue
      const sid = log.session_id
      const date = sessionDateMap[sid]
      if (!date) continue
      if (!bySession[sid]) bySession[sid] = { date, dateLabel: formatDate(date), volume: 0, isPR: false }
      bySession[sid].volume += (log.actual_weight_kg ?? 0) * (log.actual_reps ?? 0)
      if (log.is_pr) bySession[sid].isPR = true
    }
    return Object.values(bySession).sort((a, b) => new Date(a.date) - new Date(b.date))
  })()
  const filteredStrengthData = filterByRange(strengthData, RANGES[strengthRange], 'date')

  const tooltipStyle = { background: '#1a2e1a', border: '1px solid rgba(238,242,238,0.15)', borderRadius: 8, color: '#EEF2EE', fontFamily: 'var(--font-body)', fontSize: 12 }
  const axisStyle = { fill: 'rgba(238,242,238,0.4)', fontSize: 11 }

  return (
    <div>
      {/* ── Stats Row ── */}
      {metricsLoading ? null : metrics.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', color: 'rgba(238,242,238,0.45)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          Log your first weigh-in below to start tracking progress.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <StatCard label="Body Weight" value={latest?.weight_kg != null ? Number(latest.weight_kg).toFixed(1) : null} unit="kg" delta={weightDelta} greenWhenDown />
          <StatCard label="Body Fat" value={latest?.body_fat_pct != null ? Number(latest.body_fat_pct).toFixed(1) : null} unit="%" delta={fatDelta} greenWhenDown hidden={!hasFat} />
        </div>
      )}

      {/* ── Body Metrics Section ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ ...LABEL, margin: 0 }}>Body Metrics</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.keys(RANGES).map(r => (
              <button key={r} onClick={() => setBodyRange(r)} style={bodyRange === r ? PILL_ACTIVE : PILL_INACTIVE}>{r}</button>
            ))}
          </div>
        </div>

        {metricsLoading ? (
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Loading...</p>
        ) : filteredBodyData.length < 2 ? (
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            Not enough data for this range.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={filteredBodyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,242,238,0.06)" />
              <XAxis dataKey="dateLabel" tick={axisStyle} />
              <YAxis yAxisId="left" tick={axisStyle} domain={['auto', 'auto']} />
              {hasFat && <YAxis yAxisId="right" orientation="right" tick={axisStyle} domain={['auto', 'auto']} />}
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${Number(v).toFixed(1)}${name === 'fat' ? '%' : ' kg'}`, name === 'fat' ? 'Body Fat %' : 'Weight']} />
              <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={2} dot={{ r: 3, fill: '#4ade80' }} activeDot={{ r: 5 }} connectNulls />
              {hasFat && <Line yAxisId="right" type="monotone" dataKey="fat" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} activeDot={{ r: 5 }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Log form */}
        <form onSubmit={handleLog} style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 120px' }}>
            <p style={{ ...LABEL, marginBottom: 6 }}>Date</p>
            <input type="date" value={logDate} max={todayISO()} onChange={e => setLogDate(e.target.value)} required style={INPUT_STYLE} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <p style={{ ...LABEL, marginBottom: 6 }}>Weight (kg)</p>
            <input type="number" step="0.1" placeholder="75.0" value={logWeight} onChange={e => setLogWeight(e.target.value)} required style={INPUT_STYLE} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <p style={{ ...LABEL, marginBottom: 6 }}>Body Fat % <span style={{ color: 'rgba(238,242,238,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
            <input type="number" step="0.1" placeholder="18.5" value={logFat} onChange={e => setLogFat(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div style={{ flex: '0 0 auto' }}>
            <button type="submit" disabled={logSaving} style={{ background: logSaving ? 'rgba(74,222,128,0.4)' : '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, cursor: logSaving ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {logSaving ? 'Saving...' : 'Log'}
            </button>
          </div>
          {logError && <p style={{ width: '100%', color: '#f87171', fontFamily: 'var(--font-body)', fontSize: 13, margin: '4px 0 0' }}>{logError}</p>}
        </form>
      </div>

      {/* ── Strength Section ── */}
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ ...LABEL, margin: 0 }}>Strength Progress</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.keys(RANGES).map(r => (
              <button key={r} onClick={() => setStrengthRange(r)} style={strengthRange === r ? PILL_ACTIVE : PILL_INACTIVE}>{r}</button>
            ))}
          </div>
        </div>

        {strengthLoading ? (
          <p style={{ color: 'rgba(238,242,238,0.4)', fontFamily: 'var(--font-body)', fontSize: 13 }}>Loading...</p>
        ) : exerciseOptions.length === 0 ? (
          <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
            No exercise data yet. Your trainer logs strength data during sessions.
          </p>
        ) : (
          <>
            <select
              value={selectedExerciseId}
              onChange={e => setSelectedExerciseId(e.target.value)}
              style={{ ...INPUT_STYLE, marginBottom: 16 }}
            >
              <option value="">Select an exercise...</option>
              {exerciseOptions.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>

            {!selectedExerciseId && (
              <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Select an exercise to view volume progress.</p>
            )}

            {selectedExerciseId && filteredStrengthData.length < 2 && (
              <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>Not enough data yet — keep training!</p>
            )}

            {selectedExerciseId && filteredStrengthData.length >= 2 && (
              <>
                <p style={{ color: 'rgba(238,242,238,0.35)', fontFamily: 'var(--font-body)', fontSize: 11, marginBottom: 8 }}>
                  🏆 Gold bars = personal record session
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={filteredStrengthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,242,238,0.06)" />
                    <XAxis dataKey="dateLabel" tick={axisStyle} />
                    <YAxis tick={axisStyle} unit=" kg" />
                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${Number(v).toFixed(0)} kg`, 'Volume']} />
                    <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                      {filteredStrengthData.map((entry, i) => (
                        <Cell key={i} fill={entry.isPR ? '#fbbf24' : '#4ade80'} fillOpacity={entry.isPR ? 1 : 0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard/client` → My Progress.
- Stats row: body weight card visible if metrics exist, empty state prompt if not
- Body Metrics section: chart renders with time range pills; log form visible
- Strength section: exercise dropdown populated (if sessions exist), bar chart with gold PR bars

- [ ] **Step 3: Test log form**

Submit a weigh-in with a past date and body weight. Verify:
- Form clears after success
- Chart updates with new data point
- Stats row updates

- [ ] **Step 4: Commit**

```bash
git add src/pages/ClientProgressTab.jsx
git commit -m "feat: implement My Progress tab with body metrics and strength charts"
```

---

### Task 5: Delete ProgressCharts.jsx

**Files:**
- Delete: `src/components/ProgressCharts.jsx`

- [ ] **Step 1: Delete the file**

```bash
rm src/components/ProgressCharts.jsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "ProgressCharts" src/
```

Expected: no output.

- [ ] **Step 3: Verify app still compiles**

Confirm dev server shows no errors. Navigate through all three client tabs.

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore: delete unused ProgressCharts component"
git push
```
