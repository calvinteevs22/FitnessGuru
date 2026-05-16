-- supabase/migrations/009_trainer_application_status.sql

-- 1. Expand the status check constraint
--    The existing constraint name is trainer_profiles_status_check (Postgres auto-names it).
--    If the apply step fails, find the real name with:
--    SELECT conname FROM pg_constraint WHERE conrelid = 'public.trainer_profiles'::regclass AND contype = 'c';
alter table public.trainer_profiles
  drop constraint if exists trainer_profiles_status_check;

alter table public.trainer_profiles
  add constraint trainer_profiles_status_check
  check (status in ('pending', 'docs_verified', 'approved', 'live', 'rejected'));

-- 2. Add new tracking columns
alter table public.trainer_profiles
  add column if not exists rejection_reason text,
  add column if not exists application_ref   text unique,
  add column if not exists docs_submitted_at timestamptz,
  add column if not exists approved_at       timestamptz,
  add column if not exists live_at           timestamptz;

-- 3. Update submit_trainer_profile to return application_ref (text) and set docs_submitted_at
--    Signature change: returns text instead of void.
--    The frontend call (supabase.rpc) will now receive { data: 'RPT-XXXXX', error: null }.
--    Must drop first because Postgres disallows changing return type via CREATE OR REPLACE.
drop function if exists public.submit_trainer_profile(
  text, text, text, text, text, text[], text[], int, int, text[], text[], jsonb
);

create or replace function public.submit_trainer_profile(
  p_full_name        text,
  p_phone            text,
  p_email            text,
  p_profile_photo_url text,
  p_bio              text,
  p_certifications   text[],
  p_specialties      text[],
  p_years_experience int,
  p_hourly_rate      int,
  p_session_types    text[],
  p_locations_served text[],
  p_documents        jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref text;
begin
  -- Preserve existing ref on resubmit; generate new one for first submission
  select application_ref into v_ref
  from public.trainer_profiles where id = auth.uid();

  insert into public.profiles (id, role, full_name, phone, email, profile_photo_url, bio)
  values (auth.uid(), 'trainer', p_full_name, p_phone, p_email, p_profile_photo_url, p_bio)
  on conflict (id) do update set
    role              = 'trainer',
    full_name         = excluded.full_name,
    phone             = excluded.phone,
    email             = excluded.email,
    profile_photo_url = excluded.profile_photo_url,
    bio               = excluded.bio;

  -- Try to generate a unique ref
  loop
    if v_ref is null then
      v_ref := 'RPT-' || lpad((floor(random() * 99999) + 1)::text, 5, '0');
    end if;

    begin
      insert into public.trainer_profiles (
        id, certifications, specialties, years_experience, hourly_rate,
        session_types, locations_served, documents, status,
        application_ref, docs_submitted_at
      )
      values (
        auth.uid(), p_certifications, p_specialties, p_years_experience, p_hourly_rate,
        p_session_types, p_locations_served, p_documents, 'pending',
        v_ref, now()
      )
      on conflict (id) do update set
        certifications    = excluded.certifications,
        specialties       = excluded.specialties,
        years_experience  = excluded.years_experience,
        hourly_rate       = excluded.hourly_rate,
        session_types     = excluded.session_types,
        locations_served  = excluded.locations_served,
        documents         = excluded.documents,
        status            = 'pending',
        application_ref   = v_ref,
        docs_submitted_at = coalesce(public.trainer_profiles.docs_submitted_at, now()),
        reviewed_at       = null,
        admin_notes       = null,
        rejection_reason  = null;
      exit; -- success, exit loop
    exception when unique_violation then
      v_ref := null; -- collision on application_ref, retry with new ref
    end;
  end loop;

  return v_ref;
end;
$$;

-- 4. New RPC: transition approved trainer to live when first availability slot saved
create or replace function public.set_trainer_live()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.trainer_profiles
  set status  = 'live',
      live_at = now()
  where id = auth.uid()
    and status = 'approved';
end;
$$;

grant execute on function public.set_trainer_live() to authenticated;
grant execute on function public.submit_trainer_profile(text,text,text,text,text,text[],text[],int,int,text[],text[],jsonb) to authenticated;
