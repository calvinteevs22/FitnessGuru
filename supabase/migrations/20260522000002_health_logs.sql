-- supabase/migrations/20260522000002_health_logs.sql
-- Nutrition logs, macro targets, and steps logs for Daily Health Log feature

-- ── Nutrition logs ─────────────────────────────────────────────────────────────
create table public.client_nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null,
  protein_g numeric(6,1) not null check (protein_g >= 0),
  carbs_g   numeric(6,1) not null check (carbs_g >= 0),
  fats_g    numeric(6,1) not null check (fats_g >= 0),
  calories  integer generated always as (
    round(protein_g * 4 + carbs_g * 4 + fats_g * 9)
  ) stored,
  created_at timestamptz default now() not null,
  unique (client_id, logged_date)
);

alter table public.client_nutrition_logs enable row level security;

create policy "Clients manage own nutrition logs"
  on public.client_nutrition_logs for all
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

create policy "Trainers read client nutrition via booking"
  on public.client_nutrition_logs for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.client_id = client_nutrition_logs.client_id
        and bookings.trainer_id = auth.uid()
        and bookings.status in ('confirmed', 'completed')
    )
  );

-- ── Macro targets ──────────────────────────────────────────────────────────────
create table public.client_macro_targets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade unique,
  protein_g numeric(6,1) not null check (protein_g >= 0),
  carbs_g   numeric(6,1) not null check (carbs_g >= 0),
  fats_g    numeric(6,1) not null check (fats_g >= 0),
  calories  integer generated always as (
    round(protein_g * 4 + carbs_g * 4 + fats_g * 9)
  ) stored,
  set_by    text not null check (set_by in ('client', 'trainer')) default 'client',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.client_macro_targets enable row level security;

create policy "Clients manage own macro targets"
  on public.client_macro_targets for all
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

create policy "Trainers manage client macro targets via booking"
  on public.client_macro_targets for all
  using (
    exists (
      select 1 from public.bookings
      where bookings.client_id = client_macro_targets.client_id
        and bookings.trainer_id = auth.uid()
        and bookings.status in ('confirmed', 'completed')
    )
  )
  with check (
    exists (
      select 1 from public.bookings
      where bookings.client_id = client_macro_targets.client_id
        and bookings.trainer_id = auth.uid()
        and bookings.status in ('confirmed', 'completed')
    )
  );

create trigger set_macro_targets_updated_at
  before update on public.client_macro_targets
  for each row execute function public.set_updated_at();

-- ── Steps logs ─────────────────────────────────────────────────────────────────
create table public.client_steps_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  logged_date date not null,
  steps integer not null check (steps >= 0 and steps <= 100000),
  calories_burned integer,  -- computed on insert/update via trigger or app logic
  created_at timestamptz default now() not null,
  unique (client_id, logged_date)
);

alter table public.client_steps_logs enable row level security;

create policy "Clients manage own steps logs"
  on public.client_steps_logs for all
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

create policy "Trainers read client steps via booking"
  on public.client_steps_logs for select
  using (
    exists (
      select 1 from public.bookings
      where bookings.client_id = client_steps_logs.client_id
        and bookings.trainer_id = auth.uid()
        and bookings.status in ('confirmed', 'completed')
    )
  );
