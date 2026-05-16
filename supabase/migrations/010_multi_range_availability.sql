-- Drop old unique constraint that only allowed one range per day
alter table public.trainer_availability
  drop constraint if exists trainer_availability_trainer_id_day_of_week_key;

-- Add range_index so multiple time ranges can be ordered per day
-- Existing rows all get range_index = 0 safely
alter table public.trainer_availability
  add column if not exists range_index smallint not null default 0;

-- New unique constraint: one row per (trainer, day, range slot)
alter table public.trainer_availability
  add constraint trainer_availability_trainer_day_range_key
  unique (trainer_id, day_of_week, range_index);

-- Drop old single-range upsert (its ON CONFLICT clause referenced the dropped constraint)
drop function if exists public.upsert_trainer_availability(smallint, time, time, smallint);

-- New RPC: atomically replace all time ranges for a given day
-- p_ranges: jsonb array of {"start_time":"HH:MM","end_time":"HH:MM"}
-- Passing an empty array removes the day entirely
create or replace function public.save_trainer_day_ranges(
  p_day_of_week   smallint,
  p_ranges        jsonb,
  p_duration_mins smallint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_range jsonb;
  v_idx   smallint := 0;
begin
  delete from public.trainer_availability
  where trainer_id = auth.uid() and day_of_week = p_day_of_week;

  for v_range in select * from jsonb_array_elements(p_ranges)
  loop
    insert into public.trainer_availability
      (trainer_id, day_of_week, start_time, end_time, duration_mins, range_index)
    values
      (auth.uid(), p_day_of_week,
       (v_range->>'start_time')::time,
       (v_range->>'end_time')::time,
       p_duration_mins,
       v_idx);
    v_idx := v_idx + 1;
  end loop;
end;
$$;

grant execute on function public.save_trainer_day_ranges(smallint, jsonb, smallint) to authenticated;
