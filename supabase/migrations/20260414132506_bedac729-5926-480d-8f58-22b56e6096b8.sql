
CREATE TABLE public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL DEFAULT 'info',
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  details JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system alerts"
  ON public.system_alerts FOR SELECT TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can manage system alerts"
  ON public.system_alerts FOR ALL TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (public.is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Service role full access system alerts"
  ON public.system_alerts FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_system_alerts_created ON public.system_alerts (created_at DESC);
CREATE INDEX idx_system_alerts_unresolved ON public.system_alerts (is_resolved) WHERE is_resolved = false;
