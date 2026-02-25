
-- Table to store theme preference per IP address
CREATE TABLE public.theme_preferences (
  ip_address TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- No RLS needed - accessed via edge function with service role
ALTER TABLE public.theme_preferences ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON public.theme_preferences
  FOR ALL USING (true) WITH CHECK (true);
