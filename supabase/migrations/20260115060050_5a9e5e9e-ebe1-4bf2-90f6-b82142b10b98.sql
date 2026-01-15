-- Fix 1: Enable RLS on login_attempts table and add policies for service role only
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (needed for the edge function)
CREATE POLICY "Service role has full access to login_attempts"
ON public.login_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: Replace courier_api_settings RLS policies to restrict to admins only
-- First drop existing policies
DROP POLICY IF EXISTS "Courier API settings viewable by authenticated users" ON public.courier_api_settings;
DROP POLICY IF EXISTS "Courier API settings can be modified by authenticated users" ON public.courier_api_settings;

-- Create new admin-only policies
CREATE POLICY "Admins can view courier API settings"
ON public.courier_api_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can insert courier API settings"
ON public.courier_api_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update courier API settings"
ON public.courier_api_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete courier API settings"
ON public.courier_api_settings
FOR DELETE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));