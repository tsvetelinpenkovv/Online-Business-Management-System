-- Create table for tracking login attempts by IP
CREATE TABLE public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    email TEXT,
    attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    success BOOLEAN NOT NULL DEFAULT false
);

-- Create index for faster lookups by IP and time
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts (ip_address, attempt_time DESC);

-- Create index for cleanup of old records
CREATE INDEX idx_login_attempts_time ON public.login_attempts (attempt_time);

-- No RLS needed - this table is accessed via edge function with service role
-- The table tracks anonymous IP addresses, not authenticated users

-- Create function to clean up old login attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.login_attempts
    WHERE attempt_time < now() - INTERVAL '24 hours';
END;
$$;