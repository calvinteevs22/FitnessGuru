-- supabase/migrations/003_client_profiles.sql

create table public.client_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  fitness_goal text,
  preferred_region text,
  fitness_level text check (fitness_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz default now() not null
);

alter table public.client_profiles enable row level security;

create policy "Clients manage own profile"
  on public.client_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);
