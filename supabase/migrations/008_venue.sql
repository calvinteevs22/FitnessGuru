-- supabase/migrations/008_venue.sql

alter table public.bookings
  add column if not exists venue_type text
    check (venue_type in ('condo_gym', 'activesg', 'commercial_gym', 'outdoor', 'home', 'other')),
  add column if not exists venue_name text;
