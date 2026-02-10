
-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  tags TEXT[] DEFAULT '{}',
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_notes table
CREATE TABLE public.customer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Customers policies
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Customer notes policies
CREATE POLICY "Authenticated users can view customer notes" ON public.customer_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage customer notes" ON public.customer_notes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to sync customer data from orders
CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Find or create customer by phone
  SELECT * INTO customer_record FROM public.customers WHERE phone = NEW.phone LIMIT 1;
  
  IF customer_record IS NULL THEN
    INSERT INTO public.customers (name, phone, email, total_orders, total_spent, first_order_date, last_order_date)
    VALUES (NEW.customer_name, NEW.phone, NEW.customer_email, 1, NEW.total_price, NEW.created_at, NEW.created_at);
  ELSE
    UPDATE public.customers SET
      name = COALESCE(NEW.customer_name, customer_record.name),
      email = COALESCE(NEW.customer_email, customer_record.email),
      total_orders = customer_record.total_orders + 1,
      total_spent = customer_record.total_spent + NEW.total_price,
      last_order_date = NEW.created_at,
      updated_at = now()
    WHERE id = customer_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-sync customers when orders are created
CREATE TRIGGER sync_customer_on_order_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_from_order();

-- Enable realtime for customers
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- Create index for fast phone lookup
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_tags ON public.customers USING GIN(tags);
