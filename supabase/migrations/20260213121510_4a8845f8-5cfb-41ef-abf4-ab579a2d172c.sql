
-- Create stores table for multi-store management
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL, -- BG, GR, RO, HU
  country_name TEXT NOT NULL, -- България, Гърция, Румъния, Унгария
  flag_emoji TEXT NOT NULL, -- 🇧🇬, 🇬🇷, 🇷🇴, 🇭🇺
  currency TEXT NOT NULL DEFAULT 'EUR', -- EUR, RON, HUF
  currency_symbol TEXT NOT NULL DEFAULT '€', -- €, RON, Ft
  wc_url TEXT, -- WooCommerce store URL
  wc_consumer_key TEXT,
  wc_consumer_secret TEXT,
  wc_webhook_secret TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- RLS policies - admins manage, all allowed users can view
CREATE POLICY "Admins can manage stores"
  ON public.stores FOR ALL
  USING (is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Allowed users can view stores"
  ON public.stores FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- Add store_id and currency to orders
ALTER TABLE public.orders
  ADD COLUMN store_id UUID REFERENCES public.stores(id),
  ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN currency_symbol TEXT NOT NULL DEFAULT '€';

-- Add multi_store_enabled to company_settings
ALTER TABLE public.company_settings
  ADD COLUMN multi_store_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering orders by store
CREATE INDEX idx_orders_store_id ON public.orders(store_id);

-- Update trigger for stores
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
