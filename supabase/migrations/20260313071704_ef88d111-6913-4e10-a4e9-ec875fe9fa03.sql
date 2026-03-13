
-- Create courier_tracking_config table for auto-tracking settings
CREATE TABLE public.courier_tracking_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  polling_interval_minutes integer NOT NULL DEFAULT 30,
  delivered_status_name text NOT NULL DEFAULT 'Доставена',
  returned_status_name text NOT NULL DEFAULT 'Върната',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(courier_id)
);

-- Enable RLS
ALTER TABLE public.courier_tracking_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage tracking config"
  ON public.courier_tracking_config FOR ALL
  TO authenticated
  USING (public.is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (public.is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Allowed users can view tracking config"
  ON public.courier_tracking_config FOR SELECT
  TO authenticated
  USING (public.is_allowed_user((auth.jwt() ->> 'email'::text)));
