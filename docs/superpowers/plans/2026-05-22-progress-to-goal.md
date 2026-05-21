# Progress to Goal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add goal-tracking with progress rings, milestone badges, and streak rewards to the client dashboard so every login becomes a progress check-in moment.

**Architecture:** A new `client_goals` table stores one target per client (upsertable by client or trainer). Progress is computed client-side from the goal + latest `client_body_metrics` entry. A compact `GoalHeroCard` appears above the tab bar in `ClientDashboardPage`, and a full `GoalDetailCard` with edit form lives at the top of `ClientProgressTab`. Charts get a goal reference line.

**Tech Stack:** React 19, Vite, inline styles, Supabase (Postgres + RLS), recharts `ReferenceLine`, Vitest + @testing-library/react

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260522000000_client_goals.sql` | DB table + RLS |
| Create | `src/components/ProgressRing.jsx` | Reusable SVG arc ring |
| Create | `src/components/MilestoneBadges.jsx` | 5-badge milestone row |
| Create | `src/components/GoalHeroCard.jsx` | Compact hero card for dashboard |
| Create | `src/components/GoalDetailCard.jsx` | Full goal card + edit form for progress tab |
| Modify | `src/pages/ClientDashboardPage.jsx` | Add GoalHeroCard above tab bar, fetch goal data |
| Modify | `src/pages/ClientProgressTab.jsx` | Add GoalDetailCard at top, add ReferenceLine to charts |
| Modify | `src/pages/TrainerSessionPage.jsx` | Add trainer goal-setting form |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260522000000_client_goals.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260522000000_client_goals.sql

CREATE TABLE public.client_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_weight_kg numeric(5,1) NOT NULL,
  goal_body_fat_pct numeric(4,1) NOT NULL,
  start_weight_kg numeric(5,1) NOT NULL,
  start_body_fat_pct numeric(4,1) NOT NULL,
  target_date date,
  set_by text NOT NULL CHECK (set_by IN ('client', 'trainer')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (client_id)
);

ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;

-- Client: full access to their own goal
CREATE POLICY "client_goals_client_all"
  ON public.client_goals FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Trainer: read + insert/update for clients they have a confirmed booking with
CREATE POLICY "client_goals_trainer_read"
  ON public.client_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status = 'confirmed'
    )
  );

CREATE POLICY "client_goals_trainer_upsert"
  ON public.client_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status IN ('confirmed', 'completed')
    )
  );

CREATE POLICY "client_goals_trainer_update"
  ON public.client_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status IN ('confirmed', 'completed')
    )
  );

-- Admin: full access
CREATE POLICY "client_goals_admin_all"
  ON public.client_goals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER client_goals_updated_at
  BEFORE UPDATE ON public.client_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

- [ ] **Step 2: Apply migration**

```bash
SUPABASE_ACCESS_TOKEN=REDACTED_PAT \
  npx supabase db push --linked --project-ref wnwmlaqhyztwxyvzuqpe
```

Expected: `Finished supabase db push` with no errors.

- [ ] **Step 3: Verify table exists**

```bash
SUPABASE_ACCESS_TOKEN=REDACTED_PAT \
  npx supabase db query --linked --project-ref wnwmlaqhyztwxyvzuqpe \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'client_goals' ORDER BY ordinal_position;"
```

Expected: rows for id, client_id, goal_weight_kg, goal_body_fat_pct, start_weight_kg, start_body_fat_pct, target_date, set_by, created_at, updated_at.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260522000000_client_goals.sql
git commit -m "feat: add client_goals table with RLS policies"
```

---

## Task 2: ProgressRing Component

**Files:**
- Create: `src/components/ProgressRing.jsx`

`ProgressRing` renders an SVG arc ring. The arc starts at the top (−90° rotation), fills clockwise based on `progress` (0–1). Center shows the current value + unit, and a small label below.

- [ ] **Step 1: Create the component**

```jsx
// src/components/ProgressRing.jsx

export default function ProgressRing({ progress, size = 100, strokeWidth = 8, color = '#4ade80', value, unit, label }) {
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - clampedProgress)
  const cx = size / 2
  const cy = size / 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {/* Center text — positioned over the SVG */}
      <div style={{ marginTop: -(size + 6), height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: size * 0.22, color: '#EEF2EE', lineHeight: 1 }}>
          {value}<span style={{ fontSize: size * 0.14, color: 'rgba(238,242,238,0.6)' }}>{unit}</span>
        </span>
        {label && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: size * 0.11, color: 'rgba(238,242,238,0.4)', marginTop: 2 }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProgressRing.jsx
git commit -m "feat: add ProgressRing SVG arc component"
```

---

## Task 3: MilestoneBadges Component

**Files:**
- Create: `src/components/MilestoneBadges.jsx`

Five sequential badges. Earned when `maxProgress` (max of weight and fat progress) crosses the threshold. The first badge ("First weigh-in logged") is earned as soon as any body metric entry exists after the goal was set — represented by `hasMetrics` prop.

- [ ] **Step 1: Create the component**

```jsx
// src/components/MilestoneBadges.jsx

const BADGES = [
  { key: 'first', label: 'First weigh-in logged', icon: '📋', threshold: null },
  { key: 'quarter', label: 'Quarter of the way', icon: '🔥', threshold: 0.25 },
  { key: 'half', label: 'Halfway there', icon: '⚡', threshold: 0.5 },
  { key: 'three_quarter', label: '75% to goal', icon: '💪', threshold: 0.75 },
  { key: 'goal', label: 'Goal reached!', icon: '🏆', threshold: 1.0 },
]

export default function MilestoneBadges({ maxProgress, hasMetrics }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {BADGES.map(badge => {
        const earned = badge.threshold === null ? hasMetrics : maxProgress >= badge.threshold
        return (
          <div
            key={badge.key}
            style={{
              flex: '0 0 auto',
              background: earned ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${earned ? 'rgba(74,222,128,0.3)' : 'rgba(238,242,238,0.08)'}`,
              borderRadius: 10,
              padding: '10px 14px',
              textAlign: 'center',
              minWidth: 110,
              opacity: earned ? 1 : 0.45,
              transition: 'all 0.3s',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{badge.icon}</div>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
              color: earned ? '#4ade80' : 'rgba(238,242,238,0.5)',
              margin: 0, lineHeight: 1.3,
            }}>
              {badge.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/MilestoneBadges.jsx
git commit -m "feat: add MilestoneBadges component"
```

---

## Task 4: GoalHeroCard Component

**Files:**
- Create: `src/components/GoalHeroCard.jsx`

Compact card rendered above the tab bar in `ClientDashboardPage`. Fetches goal + latest metric itself. Shows two small rings, streak pill, pace, and two action buttons. If no goal exists, shows a CTA prompt.

Progress computation:
```
weightProgress = clamp((startWeight - currentWeight) / (startWeight - goalWeight), 0, 1)
fatProgress    = clamp((startFat - currentFat) / (startFat - goalFat), 0, 1)
```

Pace (only when `target_date` set):
```
totalDays   = days between goal.created_at and goal.target_date
elapsedDays = days between goal.created_at and today
expectedPct = elapsedDays / totalDays
status = weightProgress >= expectedPct + 0.1  → "Ahead"
       | weightProgress >= expectedPct - 0.05 → "On track"
       | otherwise                            → "Behind pace"
```

Streak = consecutive calendar weeks (Mon–Sun) with at least one `client_body_metrics` entry.

- [ ] **Step 1: Create the component**

```jsx
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
        <button onClick={onViewProgress} style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
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
            <button onClick={onLogWeight} style={{ background: 'none', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              Log weight
            </button>
            <button onClick={onViewProgress} style={{ background: 'none', border: '1px solid rgba(238,242,238,0.15)', color: 'rgba(238,242,238,0.6)', borderRadius: 6, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
              View progress
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GoalHeroCard.jsx
git commit -m "feat: add GoalHeroCard component"
```

---

## Task 5: GoalDetailCard Component

**Files:**
- Create: `src/components/GoalDetailCard.jsx`

Full goal card for the My Progress tab. Shows larger rings (120px), goal target summary, milestone badges, and an inline edit form. The form validates inputs, checks that a metric exists before saving, and ensures goal values differ from current values.

On first save (no existing goal): snapshots current latest metric as `start_*`. On edit: preserves existing `start_*` values.

- [ ] **Step 1: Create the component**

```jsx
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

  // Form state
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
      // Snapshot start values only on first creation
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
    <div style={CARD} ref={forwardedRef}>
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
          {/* Rings */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
            <ProgressRing progress={weightProgress} size={120} strokeWidth={10} value={latestMetric?.weight_kg ?? goal.goal_weight_kg} unit="kg" label={`of ${goal.goal_weight_kg}kg`} />
            <ProgressRing progress={fatProgress} size={120} strokeWidth={10} color="#fbbf24" value={latestMetric?.body_fat_pct ?? goal.goal_body_fat_pct} unit="%" label={`of ${goal.goal_body_fat_pct}%`} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
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
            <button type="submit" disabled={saving} style={{ background: '#4ade80', color: '#0d1a0e', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save Goal'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(238,242,238,0.2)', color: 'rgba(238,242,238,0.6)', borderRadius: 8, padding: '10px 18px', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GoalDetailCard.jsx
git commit -m "feat: add GoalDetailCard component with goal form and progress display"
```

---

## Task 6: Wire GoalHeroCard into ClientDashboardPage

**Files:**
- Modify: `src/pages/ClientDashboardPage.jsx`

Add `GoalHeroCard` above the tab bar. The card's "Log weight" button switches to the progress tab, and "View progress" does the same. Pass `setActiveTab` callbacks wrapped into named handlers.

- [ ] **Step 1: Add import at top of `ClientDashboardPage.jsx`**

After the existing imports, add:

```jsx
import GoalHeroCard from '../components/GoalHeroCard'
```

- [ ] **Step 2: Add GoalHeroCard above the tab bar**

Find the tab bar block (starts with `<div style={{ display: 'flex', gap: 4, marginBottom: 28`). Insert `GoalHeroCard` immediately before it:

```jsx
        <GoalHeroCard
          clientId={session.user.id}
          onLogWeight={() => setActiveTab('progress')}
          onViewProgress={() => setActiveTab('progress')}
        />

        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
```

- [ ] **Step 3: Verify in preview**

Run dev server (`npm run dev` if not running). Navigate to `/dashboard/client`. Confirm GoalHeroCard renders above the tabs. If no goal is set, the dashed CTA prompt appears.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ClientDashboardPage.jsx
git commit -m "feat: add GoalHeroCard to client dashboard above tab bar"
```

---

## Task 7: Wire GoalDetailCard + Goal Lines into ClientProgressTab

**Files:**
- Modify: `src/pages/ClientProgressTab.jsx`

Two changes:
1. Add `GoalDetailCard` at the top of the returned JSX (above the stats row)
2. Add `ReferenceLine` from recharts to both body weight and body fat charts

- [ ] **Step 1: Add imports**

At top of `ClientProgressTab.jsx`, add to the recharts import:

```jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
```

And add the component import after the supabase import:

```jsx
import GoalDetailCard from '../components/GoalDetailCard'
```

- [ ] **Step 2: Add goal state**

Add two state variables after the existing state declarations (around line 100):

```jsx
  const [goal, setGoal] = useState(null)
```

- [ ] **Step 3: Fetch goal alongside metrics**

In `fetchMetrics`, add a goal fetch. Replace the existing `fetchMetrics` function:

```jsx
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
```

- [ ] **Step 4: Add GoalDetailCard above stats row**

In the returned JSX, right before `{/* ── Section 1: Stats Row ── */}`, add:

```jsx
      {/* ── Goal Detail Card ── */}
      <GoalDetailCard clientId={clientId} />
```

- [ ] **Step 5: Add ReferenceLine to body weight chart**

Inside the `<LineChart>` for body metrics, after the existing `<Line>` elements, add:

```jsx
              {goal?.goal_weight_kg && (
                <ReferenceLine yAxisId="left" y={goal.goal_weight_kg} stroke="rgba(74,222,128,0.4)" strokeDasharray="6 3" label={{ value: 'Goal', fill: 'rgba(74,222,128,0.5)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              )}
              {goal?.goal_body_fat_pct && hasFat && (
                <ReferenceLine yAxisId="right" y={goal.goal_body_fat_pct} stroke="rgba(251,191,36,0.4)" strokeDasharray="6 3" label={{ value: 'Goal', fill: 'rgba(251,191,36,0.5)', fontSize: 11, fontFamily: 'var(--font-body)' }} />
              )}
```

- [ ] **Step 6: Verify in preview**

Navigate to `/dashboard/client` → My Progress tab. Confirm:
- GoalDetailCard appears at the top with "Set Goal" button
- Setting a goal shows the rings and badges
- Charts show a dashed reference line at the goal value

- [ ] **Step 7: Commit**

```bash
git add src/pages/ClientProgressTab.jsx
git commit -m "feat: add GoalDetailCard and goal reference lines to ClientProgressTab"
```

---

## Task 8: Trainer Goal-Setting in TrainerSessionPage

**Files:**
- Modify: `src/pages/TrainerSessionPage.jsx`

Add a "Client Goal" card visible during the `day-select` and `logging` phases. The trainer can view the client's current goal and set/update it. The save upserts with `set_by = 'trainer'`, snapshotting the latest client body metric as `start_*` only if no goal existed before.

- [ ] **Step 1: Add goal state + fetch to the existing `load()` function**

Add after the existing state declarations (around line 35):

```jsx
  const [clientGoal, setClientGoal] = useState(null)
  const [latestClientMetric, setLatestClientMetric] = useState(null)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [trainerGoalWeight, setTrainerGoalWeight] = useState('')
  const [trainerGoalFat, setTrainerGoalFat] = useState('')
  const [trainerTargetDate, setTrainerTargetDate] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)
  const [goalError, setGoalError] = useState(null)
```

In the `load()` function inside the `useEffect`, after `setPlan(planData ?? null)`, add:

```jsx
      if (bk?.client_id) {
        const [goalRes, metricRes] = await Promise.all([
          supabase.from('client_goals').select('*').eq('client_id', bk.client_id).maybeSingle(),
          supabase.from('client_body_metrics').select('measured_at, weight_kg, body_fat_pct')
            .eq('client_id', bk.client_id).order('measured_at', { ascending: false }).limit(1),
        ])
        setClientGoal(goalRes.data ?? null)
        setLatestClientMetric(metricRes.data?.[0] ?? null)
      }
```

- [ ] **Step 2: Add `handleSaveGoal` function**

After `handleSkipMetrics`, add:

```jsx
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
```

- [ ] **Step 3: Add goal card to the JSX**

In the JSX, after the `{phase === 'metrics' && ...}` block and before the `{phase === 'day-select' && ...}` block, insert:

```jsx
        {(phase === 'day-select' || phase === 'logging') && (
          <div style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: clientGoal ? 16 : 0 }}>
              <h2 style={{ color: '#EEF2EE', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, margin: 0 }}>
                Client Goal
              </h2>
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
```

- [ ] **Step 4: Verify in preview**

Navigate to `/trainer/session/:bookingId`. After saving pre-session metrics, confirm the "Client Goal" card appears with the Set/Edit Goal form.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TrainerSessionPage.jsx
git commit -m "feat: add trainer goal-setting form to TrainerSessionPage"
```

---

## Task 9: Tests

**Files:**
- Create: `src/components/ProgressRing.test.jsx`
- Create: `src/components/MilestoneBadges.test.jsx`

- [ ] **Step 1: Write ProgressRing tests**

```jsx
// src/components/ProgressRing.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressRing from './ProgressRing'

describe('ProgressRing', () => {
  it('renders the value and unit', () => {
    render(<ProgressRing progress={0.5} value={75.5} unit="kg" label="of 70kg" />)
    expect(screen.getByText(/75.5/)).toBeTruthy()
    expect(screen.getByText(/kg/)).toBeTruthy()
    expect(screen.getByText('of 70kg')).toBeTruthy()
  })

  it('renders without label', () => {
    render(<ProgressRing progress={0.75} value={18} unit="%" />)
    expect(screen.getByText(/18/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Write MilestoneBadges tests**

```jsx
// src/components/MilestoneBadges.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MilestoneBadges from './MilestoneBadges'

describe('MilestoneBadges', () => {
  it('shows all 5 badge labels', () => {
    render(<MilestoneBadges maxProgress={0} hasMetrics={false} />)
    expect(screen.getByText('First weigh-in logged')).toBeTruthy()
    expect(screen.getByText('Quarter of the way')).toBeTruthy()
    expect(screen.getByText('Halfway there')).toBeTruthy()
    expect(screen.getByText('75% to goal')).toBeTruthy()
    expect(screen.getByText('Goal reached!')).toBeTruthy()
  })

  it('first badge earned when hasMetrics is true', () => {
    render(<MilestoneBadges maxProgress={0} hasMetrics={true} />)
    // First badge should have green color styling (opacity 1)
    const firstBadge = screen.getByText('First weigh-in logged').closest('div')
    expect(firstBadge.style.opacity).toBe('1')
  })

  it('halfway badge earned at 0.5 progress', () => {
    render(<MilestoneBadges maxProgress={0.5} hasMetrics={true} />)
    const halfBadge = screen.getByText('Halfway there').closest('div')
    expect(halfBadge.style.opacity).toBe('1')
  })

  it('all badges earned at 1.0 progress', () => {
    render(<MilestoneBadges maxProgress={1.0} hasMetrics={true} />)
    const goalBadge = screen.getByText('Goal reached!').closest('div')
    expect(goalBadge.style.opacity).toBe('1')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/components/ProgressRing.test.jsx src/components/MilestoneBadges.test.jsx
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProgressRing.test.jsx src/components/MilestoneBadges.test.jsx
git commit -m "test: add ProgressRing and MilestoneBadges tests"
```

---

## Task 10: Push to GitHub

- [ ] **Step 1: Push**

```bash
git push
```

Expected: all commits pushed to `origin/main`, Vercel auto-deploys.
