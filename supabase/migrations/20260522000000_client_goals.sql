-- supabase/migrations/20260522000000_client_goals.sql

CREATE TABLE public.client_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_weight_kg numeric(5,1) NOT NULL,
  goal_body_fat_pct numeric(4,1) NOT NULL,
  start_weight_kg numeric(5,1) NOT NULL,
  start_body_fat_pct numeric(4,1) NOT NULL,
  target_date date,
  set_by text NOT NULL CHECK (set_by IN ('client', 'trainer')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (client_id)
);

ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;

-- Client: full access to their own goal
CREATE POLICY "client_goals_client_all"
  ON public.client_goals FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Trainer: read for clients they have a booking with
CREATE POLICY "client_goals_trainer_read"
  ON public.client_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status = 'confirmed'
    )
  );

-- Trainer: insert for clients they have a confirmed or completed booking with
CREATE POLICY "client_goals_trainer_upsert"
  ON public.client_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status IN ('confirmed', 'completed')
    )
  );

-- Trainer: update for clients they have a confirmed or completed booking with
CREATE POLICY "client_goals_trainer_update"
  ON public.client_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.trainer_id = auth.uid()
        AND b.client_id = client_goals.client_id
        AND b.status IN ('confirmed', 'completed')
    )
  );

-- Admin: full access
CREATE POLICY "client_goals_admin_all"
  ON public.client_goals FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER client_goals_updated_at
  BEFORE UPDATE ON public.client_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
