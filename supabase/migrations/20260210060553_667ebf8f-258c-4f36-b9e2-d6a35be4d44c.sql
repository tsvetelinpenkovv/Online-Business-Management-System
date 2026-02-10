
-- Add payment tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text NULL,
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone NULL;

-- Create expenses table for tracking costs
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
ON public.expenses FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage expenses"
ON public.expenses FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create credit_notes table for returns
CREATE TABLE public.credit_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id),
  invoice_id uuid REFERENCES public.invoices(id),
  credit_note_number integer NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NULL,
  amount numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view credit notes"
ON public.credit_notes FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage credit notes"
ON public.credit_notes FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
