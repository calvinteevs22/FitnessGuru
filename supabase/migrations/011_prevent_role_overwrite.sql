-- supabase/migrations/011_prevent_role_overwrite.sql
-- Guard submit_trainer_profile and client profile upsert against overwriting existing roles.
-- Prevents e.g. an admin account from accidentally becoming a trainer or client.

-- Re-create submit_trainer_profile with role guard
-- Must drop first (return type unchanged, but we're adding logic)
drop function if exists public.submit_trainer_profile(
  text, text, text, text, text, text[], text[], int, int, text[], text[], jsonb
);

create or replace function public.submit_trainer_profile(
  p_full_name         text,
  p_phone             text,
  p_email             text,
  p_profile_photo_url text,
  p_bio               text,
  p_certifications    text[],
  p_specialties       text[],
  p_years_experience  int,
  p_hourly_rate       int,
  p_session_types     text[],
  p_locations_served  text[],
  p_documents         jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ref           text;
  v_existing_role text;
begin
  -- Prevent non-trainer accounts from being overwritten
  select role into v_existing_role
  from public.profiles where id = auth.uid();

  if v_existing_role is not null and v_existing_role != 'trainer' then
    raise exception 'An account with role "%" already exists for this email.', v_existing_role
      using errcode = 'P0001';
  end if;

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

  -- Try to generate a unique ref (retry on collision)
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
      exit;
    exception when unique_violation then
      v_ref := null;
    end;
  end loop;

  return v_ref;
end;
$$;

grant execute on function public.submit_trainer_profile(text,text,text,text,text,text[],text[],int,int,text[],text[],jsonb) to authenticated;
