CREATE POLICY "clients can insert own body metrics"
ON client_body_metrics FOR INSERT
TO authenticated
WITH CHECK (client_id = auth.uid());
