-- Create price history table for tracking price changes
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL CHECK (field_changed IN ('purchase_price', 'sale_price')),
  old_value NUMERIC,
  new_value NUMERIC,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create policies for price history
CREATE POLICY "Price history is viewable by authenticated users" 
ON public.price_history 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Price history can be inserted by authenticated users" 
ON public.price_history 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_price_history_product_id ON public.price_history(product_id);
CREATE INDEX idx_price_history_changed_at ON public.price_history(changed_at DESC);

-- Create trigger function to log price changes
CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log purchase_price change
  IF OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN
    INSERT INTO public.price_history (product_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'purchase_price', OLD.purchase_price, NEW.purchase_price, auth.uid());
  END IF;
  
  -- Log sale_price change
  IF OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
    INSERT INTO public.price_history (product_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'sale_price', OLD.sale_price, NEW.sale_price, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on inventory_products
CREATE TRIGGER log_inventory_price_changes
  AFTER UPDATE ON public.inventory_products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_price_change();

-- Create courier_api_settings table for storing courier credentials
CREATE TABLE public.courier_api_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  api_url TEXT,
  username TEXT,
  password TEXT,
  client_id TEXT,
  client_secret TEXT,
  api_key TEXT,
  is_test_mode BOOLEAN DEFAULT true,
  is_enabled BOOLEAN DEFAULT false,
  extra_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(courier_id)
);

-- Enable RLS
ALTER TABLE public.courier_api_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Courier API settings viewable by authenticated users" 
ON public.courier_api_settings 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Courier API settings can be modified by authenticated users" 
ON public.courier_api_settings 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_courier_api_settings_updated_at
  BEFORE UPDATE ON public.courier_api_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create shipments table for storing created waybills
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
  courier_id UUID NOT NULL REFERENCES public.couriers(id),
  waybill_number TEXT NOT NULL,
  label_url TEXT,
  status TEXT DEFAULT 'created',
  sender_name TEXT,
  sender_phone TEXT,
  sender_address TEXT,
  sender_city TEXT,
  sender_office_code TEXT,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT,
  recipient_city TEXT,
  recipient_office_code TEXT,
  delivery_type TEXT DEFAULT 'office' CHECK (delivery_type IN ('office', 'address', 'automat')),
  weight NUMERIC DEFAULT 1,
  cod_amount NUMERIC DEFAULT 0,
  declared_value NUMERIC DEFAULT 0,
  service_type TEXT,
  notes TEXT,
  courier_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shipments viewable by authenticated users" 
ON public.shipments 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Shipments can be modified by authenticated users" 
ON public.shipments 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_courier_id ON public.shipments(courier_id);
CREATE INDEX idx_shipments_waybill_number ON public.shipments(waybill_number);
CREATE INDEX idx_shipments_created_at ON public.shipments(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();