-- supabase/migrations/20260522000001_client_profile_enrichment.sql
-- Add height and budget fields to client_profiles for richer matching + steps calorie calc

alter table public.client_profiles
  add column if not exists height_cm numeric(5,1) check (height_cm > 100 and height_cm < 250),
  add column if not exists budget_sgd integer check (budget_sgd >= 0);

-- Trainer read access (via confirmed/completed booking)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'client_profiles'
      and policyname = 'Trainers read client profiles via booking'
  ) then
    create policy "Trainers read client profiles via booking"
      on public.client_profiles for select
      using (
        exists (
          select 1 from public.bookings
          where bookings.client_id = client_profiles.id
            and bookings.trainer_id = auth.uid()
            and bookings.status in ('confirmed', 'completed')
        )
      );
  end if;
end$$;
