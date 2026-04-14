
-- Fix 1: webhook_events — restrict full access to service_role only
DROP POLICY IF EXISTS "Service role full access webhook events" ON public.webhook_events;
CREATE POLICY "Service role full access webhook events"
  ON public.webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fix 2: couriers — restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view couriers" ON public.couriers;
CREATE POLICY "Authenticated users can view couriers"
  ON public.couriers FOR SELECT TO authenticated USING (true);
