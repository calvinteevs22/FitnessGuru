-- supabase/migrations/012_trainer_profile_self_update.sql
-- Allow trainers to update their own non-sensitive profile fields via a
-- SECURITY DEFINER function. Direct table UPDATE is intentionally blocked
-- to prevent trainers from self-promoting their status to 'live'.

create or replace function public.update_trainer_profile_fields(
  p_specialties      text[],
  p_years_experience int,
  p_hourly_rate      int,
  p_locations_served text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trainer_profiles
  set
    specialties      = p_specialties,
    years_experience = p_years_experience,
    hourly_rate      = p_hourly_rate,
    locations_served = p_locations_served
  where id = auth.uid();
end;
$$;

grant execute on function public.update_trainer_profile_fields(text[], int, int, text[]) to authenticated;
