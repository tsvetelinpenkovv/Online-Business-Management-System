-- Create couriers table for storing courier logos
CREATE TABLE public.couriers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view couriers"
ON public.couriers
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert couriers"
ON public.couriers
FOR INSERT
WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can update couriers"
ON public.couriers
FOR UPDATE
USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can delete couriers"
ON public.couriers
FOR DELETE
USING (is_admin((auth.jwt() ->> 'email'::text)));

-- Trigger for updated_at
CREATE TRIGGER update_couriers_updated_at
BEFORE UPDATE ON public.couriers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Bulgarian couriers
INSERT INTO public.couriers (name) VALUES 
  ('Еконт'),
  ('Спиди'),
  ('Box Now');