-- Create order_items table for storing individual products per order
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  catalog_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_items
CREATE POLICY "Authenticated users can view order items"
ON public.order_items
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert order items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update order items"
ON public.order_items
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete order items"
ON public.order_items
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();