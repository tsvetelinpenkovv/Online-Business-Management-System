
-- webhook_events: idempotency tracking for incoming webhooks
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL,
  platform text NOT NULL,
  event_type text NOT NULL DEFAULT 'order',
  payload jsonb,
  processed boolean NOT NULL DEFAULT false,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  UNIQUE(platform, event_id)
);

CREATE INDEX idx_webhook_events_platform_event ON public.webhook_events(platform, event_id);
CREATE INDEX idx_webhook_events_processed ON public.webhook_events(processed, created_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events" ON public.webhook_events
  FOR SELECT USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Service role full access webhook events" ON public.webhook_events
  FOR ALL USING (true) WITH CHECK (true);

-- sync_jobs: background job tracking
CREATE TABLE public.sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type text NOT NULL,
  platform text,
  status text NOT NULL DEFAULT 'pending',
  total_items integer DEFAULT 0,
  processed_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,
  error_message text,
  started_by uuid,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sync_jobs_status ON public.sync_jobs(status, created_at DESC);
CREATE INDEX idx_sync_jobs_type ON public.sync_jobs(job_type, created_at DESC);

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view sync jobs" ON public.sync_jobs
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Allowed users can insert sync jobs" ON public.sync_jobs
  FOR INSERT WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Service role full access sync jobs" ON public.sync_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- sync_job_logs: detailed log entries per sync job
CREATE TABLE public.sync_job_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_job_logs_job ON public.sync_job_logs(job_id, created_at);

ALTER TABLE public.sync_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view sync job logs" ON public.sync_job_logs
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Service role full access sync job logs" ON public.sync_job_logs
  FOR ALL USING (true) WITH CHECK (true);
