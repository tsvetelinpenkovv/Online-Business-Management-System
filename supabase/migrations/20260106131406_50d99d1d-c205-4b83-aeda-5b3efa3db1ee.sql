-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create company_settings table for invoice data
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  eik TEXT,
  registered_address TEXT,
  correspondence_address TEXT,
  manager_name TEXT,
  vat_registered BOOLEAN DEFAULT false,
  vat_number TEXT,
  email TEXT,
  phone TEXT,
  bank_name TEXT,
  bank_iban TEXT,
  bank_bic TEXT,
  next_invoice_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can manage company settings
CREATE POLICY "Admins can view company settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can insert company settings"
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update company settings"
ON public.company_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

-- Create invoices table to track issued invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number INTEGER NOT NULL,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tax_event_date DATE,
  seller_name TEXT NOT NULL,
  seller_eik TEXT,
  seller_address TEXT,
  seller_vat_number TEXT,
  buyer_name TEXT NOT NULL,
  buyer_eik TEXT,
  buyer_address TEXT,
  buyer_vat_number TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  product_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 20,
  vat_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert invoices"
ON public.invoices
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default company settings row
INSERT INTO public.company_settings (id) VALUES (gen_random_uuid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();