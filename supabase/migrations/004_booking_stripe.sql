-- supabase/migrations/004_booking_stripe.sql

-- 1. Update the bookings status check to include 'pending'
DO $$
DECLARE
  cname text;
BEGIN
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'bookings'
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name ILIKE '%status%'
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));

-- 2. Add Stripe tracking columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS amount_sgd int;

-- 3. Public read for approved trainer_profiles (needed for /trainers and /trainer/:id)
DO $$ BEGIN
  CREATE POLICY "Public read approved trainer profiles"
    ON public.trainer_profiles FOR SELECT
    USING (status = 'approved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Public read for profiles (needed to join full_name, bio, photo on trainer pages)
DO $$ BEGIN
  CREATE POLICY "Public read profiles"
    ON public.profiles FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
