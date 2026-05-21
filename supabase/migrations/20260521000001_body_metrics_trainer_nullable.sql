-- Allow client self-logged body metrics (no trainer required)
ALTER TABLE client_body_metrics ALTER COLUMN trainer_id DROP NOT NULL;
