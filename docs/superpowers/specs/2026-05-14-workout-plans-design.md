# Workout Plans & Session Logging Design Spec

> **For agentic workers:** This spec covers two sub-projects. Implement Sub-project 1 first (Plan Builder), then Sub-project 2 (Session Logging). Each has its own implementation plan.

**Goal:** Enable trainers to build workout plan templates, assign personalised plans to individual clients, log sessions live during training, and give clients visibility into their plan and progress over time.

**Scope:** Two sub-projects:
- **Sub-project 1:** Exercise library + Template builder + Client plan assignment + Client plan view
- **Sub-project 2:** Live session logging + Body metrics + Progress graphs + PRs + Streak + Plan auto-archive

**Tech Stack:** React 19 (inline styles, no CSS modules), Supabase (Postgres + RLS), Recharts (add via npm for graphs)

---

## Data Model

### New Tables

#### `exercises` (global library, seeded by ReadyPT)
```sql
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null, -- e.g. 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'
  equipment text not null,    -- e.g. 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'
  description text,
  created_at timestamptz default now()
);
```
Seeded with ~300+ exercises covering all major muscle groups and equipment types. Read-only for trainers (no RLS insert/update for trainer role).

#### `plan_templates` (trainer's reusable templates)
```sql
create table plan_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  goal text,
  day_count int not null default 1,
  created_at timestamptz default now()
);
```

#### `template_days`
```sql
create table template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references plan_templates(id) on delete cascade not null,
  day_number int not null,  -- 1-based
  label text not null,      -- e.g. 'Day 1 – Push', 'Rest Day'
  is_rest boolean default false
);
```

#### `template_exercises`
```sql
create table template_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references template_days(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  position int not null default 0,  -- display order
  sets int not null default 3,
  reps int not null default 10,
  weight_kg numeric(5,2),           -- null = bodyweight
  notes text
);
```

#### `client_plans` (per-client copy of a template)
```sql
create table client_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references profiles(id) not null,
  client_id uuid references profiles(id) not null,
  name text not null,
  goal text,
  status text not null default 'active', -- 'active' | 'archived'
  assigned_at timestamptz default now(),
  total_weeks int,  -- used for plan completion tracking
  -- enforced at app level: only one active plan per client at a time
);
```

#### `client_plan_days` and `client_plan_exercises`
Mirrors of `template_days` and `template_exercises` but scoped to `client_plan_id`. Fully editable without affecting the source template.

```sql
create table client_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references client_plans(id) on delete cascade not null,
  day_number int not null,
  label text not null,
  is_rest boolean default false
);

create table client_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references client_plan_days(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  position int not null default 0,
  sets int not null default 3,
  reps int not null default 10,
  weight_kg numeric(5,2),
  notes text
);
```

#### `client_sessions` (Sub-project 2)
```sql
create table client_sessions (
  id uuid primary key default gen_random_uuid(),
  client_plan_id uuid references client_plans(id) not null,
  booking_id uuid references bookings(id) not null,  -- must tie to a confirmed booking
  trainer_id uuid references profiles(id) not null,
  client_id uuid references profiles(id) not null,
  logged_at timestamptz default now(),
  trainer_notes text
);
```

#### `client_body_metrics` (Sub-project 2)
```sql
create table client_body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id) not null,
  trainer_id uuid references profiles(id) not null,
  session_id uuid references client_sessions(id),
  measured_at timestamptz default now(),
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1)
);
```

#### `session_exercise_logs` (Sub-project 2)
```sql
create table session_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references client_sessions(id) on delete cascade not null,
  client_plan_exercise_id uuid references client_plan_exercises(id) not null,
  set_number int not null,
  actual_reps int,
  actual_weight_kg numeric(5,2),
  is_pr boolean default false  -- flagged automatically on insert
);
```

### RLS Policies
- `exercises`: readable by all authenticated users, no insert/update for trainers
- `plan_templates`: trainer sees only their own
- `template_days`, `template_exercises`: trainer sees only via their templates
- `client_plans`: trainer sees plans they created; client sees plans assigned to them
- `client_plan_days`, `client_plan_exercises`: same scoping as client_plans
- `client_sessions`, `session_exercise_logs`, `client_body_metrics`: trainer sees records they created; client sees their own records

---

## Sub-project 1: Plan Builder

### Trainer Experience — new "Plans" tab in TrainerDashboardPage

Tab added to existing tab list: `{ key: 'plans', label: 'Plans' }`.

The Plans tab has two sub-sections toggled by a pill switcher: **Templates** and **Clients**.

#### Templates sub-section
- Lists all trainer's templates: name, goal, day count, number of active client plans using it
- "New Template" button → inline builder:
  - Name field + Goal field (free text)
  - "Add Day" button → creates a day row with label input + toggle for rest day
  - Per non-rest day: exercise search (autocomplete against `exercises` table, filterable by muscle_group and equipment dropdown) → select exercise → inline row with sets/reps/weight/notes inputs
  - Exercises within a day can be reordered (drag or up/down arrows)
  - Save template → writes to `plan_templates` + `template_days` + `template_exercises`
- Edit / Delete existing templates

#### Clients sub-section
- Lists all clients the trainer has had a confirmed or completed booking with (query `bookings` table)
- Per client row: name, active plan name (or "No plan assigned"), "Assign Plan" / "Edit Plan" button
- **Assign flow:**
  1. Trainer picks a template from their library
  2. System deep-copies template → `client_plans` + `client_plan_days` + `client_plan_exercises`
  3. Trainer can edit the copied plan before saving (add/remove exercises, change sets/reps/weight)
  4. Save → plan becomes active for that client
- **Edit flow:** same editor, opens existing `client_plan` data
- Trainer can also view the client's progress graphs from this view (see Sub-project 2)

---

## Sub-project 2: Session Logging

### Session Logging Flow — trainer side

From Plans tab → Clients sub-section → select client → "Start Session" button.

"Start Session" is only enabled if:
- Client has an active plan
- There is a confirmed booking with that client today

#### Session screen (full-page overlay or new route `/trainer/session/:bookingId`):

1. **Pre-session body metrics (optional)**
   - Weight (kg) input + Body fat % input
   - "Skip" option — metrics are optional
   - On save: writes to `client_body_metrics`

2. **Live exercise log**
   - Shows today's plan day (trainer selects which day if not auto-detected)
   - Per exercise: target sets × reps × weight shown as grey reference
   - Trainer taps "Log Set" per set → inputs actual reps + actual weight → saves immediately to `session_exercise_logs`
   - PR detection: on each set insert, compare `actual_weight_kg` against max historical `actual_weight_kg` for same `exercise_id` + `client_id`. If new max → set `is_pr = true`, show "🏆 PR" badge inline

3. **Session notes**
   - Free-text field at bottom of screen
   - Saved on session end

4. **End Session**
   - Writes `client_sessions` record with `trainer_notes`
   - Returns trainer to Plans tab

### Client Experience — new "My Plan" tab in ClientDashboardPage

Tab added to existing tab list: `{ key: 'plan', label: 'My Plan' }`.

Two sub-sections toggled by pill switcher: **Plan** and **Progress**.

#### Plan sub-section
- Shows active plan name + goal
- Lists days (Day 1, Day 2, Rest, etc.)
- Tap a day → expands to show exercises: name, target sets × reps × weight, trainer notes
- Read-only — client cannot edit
- **Plan progress indicator:** "Week X of Y" based on sessions logged vs total_weeks. Shows a simple progress bar.
- **Streak:** "🔥 4-week streak" — counts consecutive calendar weeks with at least one logged session

#### Progress sub-section
Two tabs: **Body** and **Strength**

**Body tab:**
- Line chart (Recharts `LineChart`) of bodyweight and body fat % over time
- X-axis: date of each session measurement
- Two lines: weight_kg (left axis) and body_fat_pct (right axis)
- Shows "No data yet" empty state if fewer than 2 data points

**Strength tab:**
- Exercise dropdown (lists all exercises that have been logged for this client)
- On select: line chart of max weight lifted per session for that exercise over time
- Second line: total reps per session
- PR points highlighted with a distinct marker on the chart
- Shows "No data yet" empty state if exercise has no logs

### Trainer Progress View (per client)
From Plans tab → select client → "View Progress" link.
Shows the same Progress sub-section (Body + Strength charts) that the client sees, scoped to that client's data. Trainer can review before each session.

---

## Plan Auto-Archive

When `total_weeks` is set on a `client_plan` and the number of logged sessions reaches `total_weeks × non_rest_days_per_week` (where `non_rest_days_per_week` = count of non-rest `client_plan_days` that repeat weekly), the plan status auto-updates to `archived`. For simplicity in v1: archive after `total_weeks × count(non-rest days in plan)` total sessions logged.

Implementation: Postgres function triggered after insert on `client_sessions`. Checks session count vs target. If complete → sets `status = 'archived'` on `client_plans` and sends in-app notification prompt to trainer to assign next plan.

For v1, the "in-app notification" is a banner on the trainer's Plans tab: "Client [Name]'s plan is complete. Assign a new plan."

---

## Recharts Integration

Add to project:
```bash
npm install recharts
```

Use `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer` from recharts. Style to match ReadyPT dark theme (`#0d1a0e` background, `#4ade80` primary line, `#fbbf24` secondary line).

---

## Exercise Library Seed Data

Seed the `exercises` table with ~300 exercises across:
- **Muscle groups:** Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core, Full Body, Cardio
- **Equipment:** Barbell, Dumbbell, Cable, Machine, Bodyweight, Kettlebell, Resistance Band, Smith Machine, TRX, Cardio Machine

Seed via a Supabase migration SQL file. Enough variety that trainers rarely need to add custom exercises.

---

## Out of Scope (v1)

- Prebuilt ReadyPT template library (v2)
- Exercise video/cue links (v2)
- Client self-logging (trainer owns all logs)
- Sessions without a confirmed booking (intentionally excluded — keeps all sessions on-platform)
- Push notifications (banner notification only for plan completion)
