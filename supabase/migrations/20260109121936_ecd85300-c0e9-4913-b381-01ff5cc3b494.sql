-- Create table for e-commerce platforms (sources)
CREATE TABLE public.ecommerce_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  logo_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ecommerce_platforms ENABLE ROW LEVEL SECURITY;

-- RLS policies - all authenticated users can read
CREATE POLICY "Authenticated users can view platforms"
  ON public.ecommerce_platforms
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify platforms
CREATE POLICY "Admins can insert platforms"
  ON public.ecommerce_platforms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update platforms"
  ON public.ecommerce_platforms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete platforms"
  ON public.ecommerce_platforms
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.allowed_users
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_ecommerce_platforms_updated_at
  BEFORE UPDATE ON public.ecommerce_platforms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default platforms
INSERT INTO public.ecommerce_platforms (name, display_name, is_enabled) VALUES
  ('woocommerce', 'WooCommerce', true),
  ('prestashop', 'PrestaShop', false),
  ('opencart', 'OpenCart', false),
  ('magento', 'Magento', false),
  ('shopify', 'Shopify', false);