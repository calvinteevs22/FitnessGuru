-- supabase/migrations/007_session_logging.sql

-- ── Client sessions ───────────────────────────────────────────────────────────
create table public.client_sessions (
  id uuid primary key default gen_random_uuid(),
  client_plan_id uuid references public.client_plans(id) not null,
  booking_id uuid references public.bookings(id) not null,
  trainer_id uuid references public.profiles(id) not null,
  client_id uuid references public.profiles(id) not null,
  logged_at timestamptz default now(),
  trainer_notes text
);

alter table public.client_sessions enable row level security;

create policy "Trainer manages sessions they created"
  on public.client_sessions for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Client reads their own sessions"
  on public.client_sessions for select
  using (auth.uid() = client_id);

-- ── Client body metrics ───────────────────────────────────────────────────────
create table public.client_body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) not null,
  trainer_id uuid references public.profiles(id) not null,
  session_id uuid references public.client_sessions(id),
  measured_at timestamptz default now(),
  weight_kg numeric(5,2),
  body_fat_pct numeric(4,1)
);

alter table public.client_body_metrics enable row level security;

create policy "Trainer manages body metrics they recorded"
  on public.client_body_metrics for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Client reads their own body metrics"
  on public.client_body_metrics for select
  using (auth.uid() = client_id);

-- ── Session exercise logs ─────────────────────────────────────────────────────
create table public.session_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.client_sessions(id) on delete cascade not null,
  client_plan_exercise_id uuid references public.client_plan_exercises(id) not null,
  set_number int not null,
  actual_reps int,
  actual_weight_kg numeric(5,2),
  is_pr boolean not null default false
);

alter table public.session_exercise_logs enable row level security;

create policy "Trainer manages exercise logs they created"
  on public.session_exercise_logs for all
  using (
    exists (
      select 1 from public.client_sessions cs
      where cs.id = session_id and cs.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.client_sessions cs
      where cs.id = session_id and cs.trainer_id = auth.uid()
    )
  );

create policy "Client reads their own exercise logs"
  on public.session_exercise_logs for select
  using (
    exists (
      select 1 from public.client_sessions cs
      where cs.id = session_id and cs.client_id = auth.uid()
    )
  );

-- ── PR detection function ─────────────────────────────────────────────────────
create or replace function public.detect_pr()
returns trigger
language plpgsql
security definer
as $$
declare
  v_client_id uuid;
  v_exercise_id uuid;
  v_prev_max numeric;
begin
  select cs.client_id, cpe.exercise_id
    into v_client_id, v_exercise_id
  from public.client_sessions cs
  join public.client_plan_exercises cpe on cpe.id = new.client_plan_exercise_id
  where cs.id = new.session_id;

  select max(sel.actual_weight_kg)
    into v_prev_max
  from public.session_exercise_logs sel
  join public.client_sessions cs on cs.id = sel.session_id
  join public.client_plan_exercises cpe on cpe.id = sel.client_plan_exercise_id
  where cs.client_id = v_client_id
    and cpe.exercise_id = v_exercise_id
    and sel.id != new.id
    and sel.actual_weight_kg is not null;

  if new.actual_weight_kg is not null and (v_prev_max is null or new.actual_weight_kg > v_prev_max) then
    update public.session_exercise_logs set is_pr = true where id = new.id;
  end if;

  return new;
end;
$$;

create trigger after_exercise_log_insert
  after insert on public.session_exercise_logs
  for each row execute function public.detect_pr();

-- ── Plan auto-archive function ────────────────────────────────────────────────
create or replace function public.check_plan_completion()
returns trigger
language plpgsql
security definer
as $$
declare
  v_total_weeks int;
  v_non_rest_days int;
  v_target_sessions int;
  v_actual_sessions int;
begin
  select cp.total_weeks, count(cpd.id) filter (where not cpd.is_rest)
    into v_total_weeks, v_non_rest_days
  from public.client_plans cp
  left join public.client_plan_days cpd on cpd.plan_id = cp.id
  where cp.id = new.client_plan_id
  group by cp.total_weeks;

  if v_total_weeks is null then
    return new;
  end if;

  v_target_sessions := v_total_weeks * greatest(v_non_rest_days, 1);

  select count(*) into v_actual_sessions
  from public.client_sessions
  where client_plan_id = new.client_plan_id;

  if v_actual_sessions >= v_target_sessions then
    update public.client_plans set status = 'archived' where id = new.client_plan_id;
  end if;

  return new;
end;
$$;

create trigger after_session_insert
  after insert on public.client_sessions
  for each row execute function public.check_plan_completion();
