-- Trainer weekly availability template
create table public.trainer_availability (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainer_profiles(id) on delete cascade not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Sun, 1=Mon … 6=Sat
  start_time time not null,
  end_time time not null,
  duration_mins smallint not null default 60 check (duration_mins in (60, 90)),
  created_at timestamptz default now() not null,
  unique (trainer_id, day_of_week)
);

-- Specific dates the trainer is blocking off
create table public.availability_blocks (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainer_profiles(id) on delete cascade not null,
  blocked_date date not null,
  created_at timestamptz default now() not null,
  unique (trainer_id, blocked_date)
);

-- Bookings (client_id nullable for pre-launch email-only flow)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.trainer_profiles(id) on delete cascade not null,
  client_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  scheduled_at timestamptz not null,
  duration_mins smallint not null default 60 check (duration_mins in (60, 90)),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.trainer_availability enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.bookings enable row level security;

-- trainer_availability policies
create policy "Trainers manage own availability"
  on public.trainer_availability for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Public read trainer availability"
  on public.trainer_availability for select
  using (true);

-- availability_blocks policies
create policy "Trainers manage own blocks"
  on public.availability_blocks for all
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

create policy "Public read availability blocks"
  on public.availability_blocks for select
  using (true);

-- bookings policies
create policy "Trainers read own bookings"
  on public.bookings for select
  using (auth.uid() = trainer_id);

create policy "Clients read own bookings"
  on public.bookings for select
  using (auth.uid() = client_id);

create policy "Anyone can create a booking"
  on public.bookings for insert
  with check (true);

create policy "Trainers update own bookings"
  on public.bookings for update
  using (auth.uid() = trainer_id)
  with check (auth.uid() = trainer_id);

-- RPC: upsert a trainer's availability for a single day
create or replace function public.upsert_trainer_availability(
  p_day_of_week smallint,
  p_start_time time,
  p_end_time time,
  p_duration_mins smallint
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.trainer_availability (trainer_id, day_of_week, start_time, end_time, duration_mins)
  values (auth.uid(), p_day_of_week, p_start_time, p_end_time, p_duration_mins)
  on conflict (trainer_id, day_of_week) do update set
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    duration_mins = excluded.duration_mins;
end;
$$;

-- RPC: remove a trainer's availability for a single day
create or replace function public.delete_trainer_availability(p_day_of_week smallint)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.trainer_availability
  where trainer_id = auth.uid() and day_of_week = p_day_of_week;
end;
$$;

-- RPC: cancel a booking (trainer only)
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id and trainer_id = auth.uid();
end;
$$;
