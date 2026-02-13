
-- Drop existing overly permissive policies on api_settings
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.api_settings;
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.api_settings;

-- Create admin-only policies
CREATE POLICY "Admins can view settings"
ON public.api_settings
FOR SELECT
USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can manage settings"
ON public.api_settings
FOR ALL
USING (is_admin((auth.jwt() ->> 'email'::text)))
WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
