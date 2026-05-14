-- supabase/migrations/005_workout_plans.sql

-- ── Exercise library ──────────────────────────────────────────────────────────
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.exercises enable row level security;

create policy "Anyone authenticated can read exercises"
  on public.exercises for select
  using (auth.role() = 'authenticated');

-- ── Plan templates (trainer-owned) ────────────────────────────────────────────
create table public.plan_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  goal text,
  day_count int not null default 1,
  created_at timestamptz default now()
);

alter table public.plan_templates enable row level security;

create policy "Trainers manage own templates"
  on public.plan_templates for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

-- ── Template days ─────────────────────────────────────────────────────────────
create table public.template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.plan_templates(id) on delete cascade not null,
  day_number int not null,
  label text not null,
  is_rest boolean not null default false
);

alter table public.template_days enable row level security;

create policy "Trainers manage own template days"
  on public.template_days for all
  using (
    exists (
      select 1 from public.plan_templates pt
      where pt.id = template_id and pt.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plan_templates pt
      where pt.id = template_id and pt.trainer_id = auth.uid()
    )
  );

-- ── Template exercises ────────────────────────────────────────────────────────
create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references public.template_days(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  position int not null default 0,
  sets int not null default 3,
  reps int not null default 10,
  weight_kg numeric(5,2),
  notes text
);

alter table public.template_exercises enable row level security;

create policy "Trainers manage own template exercises"
  on public.template_exercises for all
  using (
    exists (
      select 1 from public.template_days td
      join public.plan_templates pt on pt.id = td.template_id
      where td.id = day_id and pt.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.template_days td
      join public.plan_templates pt on pt.id = td.template_id
      where td.id = day_id and pt.trainer_id = auth.uid()
    )
  );

-- ── Client plans ──────────────────────────────────────────────────────────────
create table public.client_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.profiles(id) not null,
  client_id uuid references public.profiles(id) not null,
  name text not null,
  goal text,
  status text not null default 'active' check (status in ('active', 'archived')),
  total_weeks int,
  assigned_at timestamptz default now()
);

alter table public.client_plans enable row level security;

create policy "Trainer sees plans they created"
  on public.client_plans for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Client sees their own plans"
  on public.client_plans for select
  using (auth.uid() = client_id);

-- ── Client plan days ──────────────────────────────────────────────────────────
create table public.client_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.client_plans(id) on delete cascade not null,
  day_number int not null,
  label text not null,
  is_rest boolean not null default false
);

alter table public.client_plan_days enable row level security;

create policy "Trainer manages client plan days"
  on public.client_plan_days for all
  using (
    exists (
      select 1 from public.client_plans cp
      where cp.id = plan_id and cp.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_plans cp
      where cp.id = plan_id and cp.trainer_id = auth.uid()
    )
  );

create policy "Client reads their plan days"
  on public.client_plan_days for select
  using (
    exists (
      select 1 from public.client_plans cp
      where cp.id = plan_id and cp.client_id = auth.uid()
    )
  );

-- ── Client plan exercises ─────────────────────────────────────────────────────
create table public.client_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references public.client_plan_days(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  position int not null default 0,
  sets int not null default 3,
  reps int not null default 10,
  weight_kg numeric(5,2),
  notes text
);

alter table public.client_plan_exercises enable row level security;

create policy "Trainer manages client plan exercises"
  on public.client_plan_exercises for all
  using (
    exists (
      select 1 from public.client_plan_days cpd
      join public.client_plans cp on cp.id = cpd.plan_id
      where cpd.id = day_id and cp.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_plan_days cpd
      join public.client_plans cp on cp.id = cpd.plan_id
      where cpd.id = day_id and cp.trainer_id = auth.uid()
    )
  );

create policy "Client reads their plan exercises"
  on public.client_plan_exercises for select
  using (
    exists (
      select 1 from public.client_plan_days cpd
      join public.client_plans cp on cp.id = cpd.plan_id
      where cpd.id = day_id and cp.client_id = auth.uid()
    )
  );
