# Client Progress Dashboard — Design Spec
**Date:** 2026-05-21
**Status:** Approved

## Problem
The client dashboard has two tabs (My Bookings, My Plan). Progress tracking is buried as a sub-view inside My Plan, uses basic charts with no time filtering, and has no stats summary. Clients lack a compelling reason to return to the app between sessions, increasing disintermediation risk.

## Goal
Add a dedicated **My Progress** tab to the client dashboard. Clients can log their own body weight and body fat % any time. All strength data (volume) flows from trainer-logged session exercises. The client only views strength data — never inputs it.

---

## Dashboard Structure Change

**Before:** My Bookings · My Plan (with hidden Plan/Progress sub-pills)
**After:** My Bookings · My Plan · My Progress

`ClientDashboardPage.jsx` adds `{ key: 'progress', label: 'My Progress' }` to `CLIENT_TABS` and renders `<ClientProgressTab clientId={session.user.id} />` when active.

The existing `ProgressCharts` import is removed from `ClientPlanTab.jsx`. The Plan/Progress sub-pills inside My Plan are removed. My Plan reverts to showing only the plan view.

---

## My Progress Tab Layout

`src/pages/ClientProgressTab.jsx` (new file). Renders three stacked sections.

### Section 1: Stats Row

Three stat cards displayed in a horizontal row (wrapping on mobile).

| Card | Value | Delta |
|------|-------|-------|
| Body Weight | Latest `weight_kg` | vs previous entry (↑ green / ↓ red / — neutral) |
| Body Fat % | Latest `body_fat_pct` | vs previous — only shown if ≥1 entry has it |


Delta direction: weight loss is green (lower = better assumed default), body fat down is green.

If no body metrics logged yet, show a single prompt card: *"Log your first weigh-in below to start tracking progress."*

### Section 2: Body Metrics

**Chart:** `recharts` `LineChart` with a single shared X axis (date).
- Weight (kg) — always shown, left Y axis, `#4ade80`
- Body Fat % — shown only if any entry has it non-null, right Y axis, `#fbbf24`

**Time range filter:** pill group — `4W · 3M · 6M · All` — defaults to `3M`. Filters the chart data client-side by slicing from today backwards.

**Log weigh-in form** (client self-service, always visible):
```
[Weight kg  ____]  [Body Fat %  ____]  [Log]
```
- Weight is required. Body fat % is optional.
- On submit: `INSERT INTO client_body_metrics (client_id, measured_at, weight_kg, body_fat_pct)` with `measured_at = now()`.
- On success: refetch metrics, clear form inputs.
- Validation: weight must be a positive number between 20–300. Body fat % between 1–70.
- Error shown inline below the form.

### Section 3: Strength Progress

**Exercise dropdown:** populated from `session_exercise_logs` joined to exercises for this client. Query joins through `client_sessions` filtered by `client_id`.

**Chart:** `recharts` `BarChart` showing total volume per session (Y axis: volume in kg, X axis: session date).

Volume per session = `SUM(actual_weight_kg × actual_reps)` across all sets for the selected exercise in that session.

PR sessions: a gold dot/marker rendered above the bar for sessions where any set has `is_pr = true`.

Time range filter: same `4W · 3M · 6M · All` pills as body section, independent state.

**Empty states:**
- No sessions logged yet: *"No exercise data yet. Your trainer logs strength data during sessions."*
- Exercise selected but < 2 data points: *"Not enough data yet — keep training!"*

---

## Data Model Change

No schema column additions needed. `weight_kg` and `body_fat_pct` already exist on `client_body_metrics`. Strength volume is computed client-side from the existing `session_exercise_logs` table.

### RLS for client self-logging

`client_body_metrics` currently allows trainer inserts. Add a client insert policy:

```sql
CREATE POLICY "clients can insert own body metrics"
ON client_body_metrics FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());
```

Client select policy (to read own metrics):
```sql
CREATE POLICY "clients can read own body metrics"
ON client_body_metrics FOR SELECT
TO authenticated
USING (client_id = auth.uid());
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/ClientProgressTab.jsx` | **Create** — full progress tab (stats row, body metrics chart + log form, strength chart) |
| `src/pages/ClientDashboardPage.jsx` | Add `progress` tab to `CLIENT_TABS`, render `ClientProgressTab` |
| `src/pages/ClientPlanTab.jsx` | Remove `ProgressCharts` import and Plan/Progress sub-pills; plan view only |
| `src/components/ProgressCharts.jsx` | **Delete** — replaced by `ClientProgressTab` |
| `supabase/migrations/YYYYMMDD_body_metrics_rls.sql` | Two RLS policies for client insert + select |

---

## Strength Query

The existing `StrengthChart` in `ProgressCharts.jsx` has a broken filter (`.eq('client_sessions.client_id', clientId)` doesn't work in PostgREST for nested relations). The new implementation fetches correctly:

```js
// Step 1: get session IDs for this client
const { data: sessions } = await supabase
  .from('client_sessions')
  .select('id, logged_at')
  .eq('client_id', clientId)

const sessionIds = sessions.map(s => s.id)

// Step 2: get exercise logs for those sessions, filtered by exercise
const { data: logs } = await supabase
  .from('session_exercise_logs')
  .select('session_id, actual_reps, actual_weight_kg, is_pr, client_plan_exercise_id, client_plan_exercises(exercise_id)')
  .in('session_id', sessionIds)

// Step 3: client-side group by session + exercise, compute volume
```

Exercise options are derived from the same logs — unique `exercise_id` values pulled through `client_plan_exercises`.

---

## Out of Scope
- Client editing or deleting body metric entries
- Trainer viewing client progress from the trainer dashboard (separate feature)
- Streak display in Progress tab (remains in My Plan)
- Push notifications / weekly progress summary emails
