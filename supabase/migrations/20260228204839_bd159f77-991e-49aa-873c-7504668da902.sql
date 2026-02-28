
-- Fix credit_notes RLS: tighten from any authenticated to allowed_users only
DROP POLICY IF EXISTS "Authenticated users can manage credit notes" ON public.credit_notes;
DROP POLICY IF EXISTS "Authenticated users can view credit notes" ON public.credit_notes;

CREATE POLICY "Allowed users can view credit notes"
  ON public.credit_notes FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert credit notes"
  ON public.credit_notes FOR INSERT
  WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'invoices'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update credit notes"
  ON public.credit_notes FOR UPDATE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete credit notes"
  ON public.credit_notes FOR DELETE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices'::text, 'delete'::text));

-- Restrict theme_preferences: remove IP from being queryable by anon, add RLS
ALTER TABLE IF EXISTS public.theme_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing overly-permissive policy
DROP POLICY IF EXISTS "Service role full access" ON public.theme_preferences;

-- Only service_role (edge functions) can access theme_preferences
CREATE POLICY "Service role only access"
  ON public.theme_preferences FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
