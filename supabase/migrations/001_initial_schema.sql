-- Helper function to check admin role (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles table (shared base for all user types)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('trainer', 'client', 'admin')),
  full_name text,
  phone text,
  profile_photo_url text,
  bio text,
  created_at timestamptz default now() not null
);

-- Trainer profiles table
create table public.trainer_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  certifications text[] default '{}',
  specialties text[] default '{}',
  years_experience int,
  hourly_rate int,
  session_types text[] default '{}',
  locations_served text[] default '{}',
  documents jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.trainer_profiles enable row level security;

-- profiles policies
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- trainer_profiles policies
create policy "Trainers read own trainer profile"
  on public.trainer_profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Trainers insert own trainer profile"
  on public.trainer_profiles for insert
  with check (auth.uid() = id);

-- Trainers update via RPC only (see below) — direct update blocked
-- Admins can update status fields
create policy "Admins update trainer profile status"
  on public.trainer_profiles for update
  using (public.is_admin());

-- RPC: create trainer profile (called after profile setup form submit)
-- Always sets status = 'pending'. Trainer cannot self-set status.
create or replace function public.submit_trainer_profile(
  p_full_name text,
  p_phone text,
  p_profile_photo_url text,
  p_bio text,
  p_certifications text[],
  p_specialties text[],
  p_years_experience int,
  p_hourly_rate int,
  p_session_types text[],
  p_locations_served text[],
  p_documents jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, role, full_name, phone, profile_photo_url, bio)
  values (auth.uid(), 'trainer', p_full_name, p_phone, p_profile_photo_url, p_bio)
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    profile_photo_url = excluded.profile_photo_url,
    bio = excluded.bio;

  insert into public.trainer_profiles (
    id, certifications, specialties, years_experience, hourly_rate,
    session_types, locations_served, documents, status
  )
  values (
    auth.uid(), p_certifications, p_specialties, p_years_experience, p_hourly_rate,
    p_session_types, p_locations_served, p_documents, 'pending'
  )
  on conflict (id) do update set
    certifications = excluded.certifications,
    specialties = excluded.specialties,
    years_experience = excluded.years_experience,
    hourly_rate = excluded.hourly_rate,
    session_types = excluded.session_types,
    locations_served = excluded.locations_served,
    documents = excluded.documents,
    status = 'pending',
    reviewed_at = null,
    admin_notes = null;
end;
$$;
