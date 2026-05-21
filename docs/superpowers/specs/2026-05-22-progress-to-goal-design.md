# Progress to Goal — Design Spec

## Goal

Add a goal-tracking and gamification layer to the client dashboard that makes every login a progress check-in moment. Clients (and their trainers) set target weight and body fat % values; the platform tracks progress against those targets with visual rings, milestone badges, and streak rewards.

## Product Principles

- **Disintermediation guard**: Goal-setting by trainers deepens platform dependency — the trainer's value is embedded in the app, not just in their person.
- **Motivation through visibility**: Progress should be impossible to miss. The goal card appears before any tab is clicked.
- **No pressure**: Deadlines are optional. Missing a deadline shouldn't feel punishing.

---

## Data Model

### New table: `client_goals`

```sql
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
```

**Key decisions:**
- One goal per client (UNIQUE on `client_id`). Goal is upserted — no history kept.
- `start_weight_kg` and `start_body_fat_pct` are snapshotted at goal creation time. Progress % = `(start - current) / (start - goal)`. This ensures progress is always measured from the same baseline even if the goal is updated.
- `set_by` determines the "Set by your trainer" vs "Your personal goal" label in the UI.
- `target_date` is optional. Pace tracking ("on track / behind") is only shown when set.

### RLS Policies

- Client: full read + upsert on own row (`client_id = auth.uid()`)
- Trainer: read + upsert for clients they have a confirmed booking with
- Admin: full access

---

## Progress Computation

All computed client-side from the goal record + latest body metric entry.

```
weightProgress = clamp((startWeight - currentWeight) / (startWeight - goalWeight), 0, 1)
fatProgress    = clamp((startFat - currentFat) / (startFat - goalFat), 0, 1)
```

**Pace (when target_date set):**
```
totalDays    = target_date - created_at
elapsedDays  = today - created_at
expectedPct  = elapsedDays / totalDays
status       = weightProgress >= expectedPct - 0.05 ? "On track" : "Behind pace"
               weightProgress >= expectedPct + 0.1  ? "Ahead"    : status
```

**Streak:** consecutive calendar weeks (Mon–Sun) with at least one `client_body_metrics` entry. Already computed in `ClientPlanTab.jsx` — reuse same `computeStreak` logic.

---

## Milestone Badges

Five badges, each with a label and threshold. Earned when **either** weight or fat progress crosses the threshold (whichever comes first). Stored as computed state — no DB column needed.

| Badge | Threshold | Label |
|-------|-----------|-------|
| First Step | any entry logged after goal set | "First weigh-in logged" |
| 25% There | 25% progress | "Quarter of the way" |
| Halfway | 50% progress | "Halfway there" |
| Almost | 75% progress | "75% to goal" |
| Goal Reached | 100% progress | "Goal reached!" |

Earned badges: `#4ade80` green. Unearned: `rgba(238,242,238,0.15)` dimmed.

---

## UI: Dashboard Hero Card

**Location:** `ClientDashboardPage.jsx` — rendered above the tab bar, always visible on load.

**Contents:**
- Two SVG arc progress rings side by side: Weight (left) and Body Fat % (right)
  - Ring stroke color: `#4ade80` on `rgba(255,255,255,0.08)` track
  - Center text: current value + unit, small label below ("of Xkg goal")
- Streak pill: `{n}-week streak` in amber (`#fbbf24`) — only shown if streak > 0
- Pace badge: "On track", "Ahead", or "Behind pace" — only shown if `target_date` is set
- Set by label: "Set by your trainer" (trainer-set) or "Your personal goal" (client-set) — small, muted
- Two action links: "Log weight" (scrolls to weigh-in form in My Progress tab) and "View progress" (switches to My Progress tab)
- **No goal state**: soft empty state — "Set a goal to start tracking your progress →" linking to My Progress tab

---

## UI: My Progress Tab Enhancements

**Goal Card** (top of `ClientProgressTab.jsx`, above existing charts):

- Larger progress rings than hero (120px diameter vs 80px)
- Goal values displayed: "Target: Xkg · Y% body fat" + optional "by [date]"
- Milestone badges row (5 badges, horizontal scroll on mobile)
- "Edit Goal" button — opens inline form:
  - Target weight (kg) — required
  - Target body fat % — required
  - Target date — optional date picker
  - On save: upsert `client_goals`, snapshot current latest metric as `start_*` values only if this is a new goal (not an edit)
- **No goal state**: prominent CTA to set goal with the form inline

**Chart enhancements:**
- Body weight chart: dashed horizontal reference line at `goal_weight_kg` (color `rgba(74,222,128,0.4)`, label "Goal")
- Body fat chart: dashed horizontal reference line at `goal_body_fat_pct` (color `rgba(251,191,36,0.4)`, label "Goal")

---

## UI: Trainer Side — Set Client Goal

**Location:** `TrainerSessionPage.jsx` — add a "Client Goal" section in the session view.

- Displays current goal if one exists (read-only summary)
- "Set Goal for Client" button — opens inline form:
  - Target weight (kg) — required
  - Target body fat % — required
  - Target date — optional
  - On save: upsert with `set_by = 'trainer'`, snapshot latest available metric for client as `start_*` values
- Trainer query: fetch client's latest `client_body_metrics` entry and `client_goals` row

---

## Component Breakdown

| Component | File | Responsibility |
|-----------|------|---------------|
| `GoalHeroCard` | `src/components/GoalHeroCard.jsx` | Compact rings + streak + pace — rendered in ClientDashboardPage |
| `GoalDetailCard` | `src/components/GoalDetailCard.jsx` | Large rings + badges + edit form — rendered in ClientProgressTab |
| `ProgressRing` | `src/components/ProgressRing.jsx` | Reusable SVG arc ring — used by both GoalHeroCard and GoalDetailCard |
| `MilestoneBadges` | `src/components/MilestoneBadges.jsx` | 5-badge row — used in GoalDetailCard |
| `TrainerGoalForm` | inline in `TrainerSessionPage.jsx` | Trainer-side set goal form |

---

## Database Migration

File: `supabase/migrations/20260522000000_client_goals.sql`

- Create `client_goals` table (schema above)
- RLS: client full access to own row
- RLS: trainer read + upsert for clients with a confirmed booking (`EXISTS` subquery on `bookings`)
- Admin full access via `is_admin()`
- `updated_at` trigger (reuse pattern from other tables or use `moddatetime` extension)

---

## Error Handling

- Goal form: validate weight 20–300kg, body fat 1–60%, target date must be in the future if set
- If no body metrics exist when goal is set: show warning "Log a weigh-in first so we can track your starting point" — block save
- If `start_weight_kg = goal_weight_kg`: block save, show "Goal weight must differ from your current weight"
- Progress rings: clamp to 0–100% — never show negative progress or >100%

---

## Files Changed

- **Create:** `supabase/migrations/20260522000000_client_goals.sql`
- **Create:** `src/components/ProgressRing.jsx`
- **Create:** `src/components/GoalHeroCard.jsx`
- **Create:** `src/components/GoalDetailCard.jsx`
- **Create:** `src/components/MilestoneBadges.jsx`
- **Modify:** `src/pages/ClientDashboardPage.jsx` — add GoalHeroCard above tab bar
- **Modify:** `src/pages/ClientProgressTab.jsx` — add GoalDetailCard at top, add goal lines to charts
- **Modify:** `src/pages/TrainerSessionPage.jsx` — add trainer goal-setting form
