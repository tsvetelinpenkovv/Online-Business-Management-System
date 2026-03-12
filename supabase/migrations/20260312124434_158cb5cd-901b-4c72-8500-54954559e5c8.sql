
-- Add track_serial_numbers flag to inventory_products
ALTER TABLE public.inventory_products 
ADD COLUMN IF NOT EXISTS track_serial_numbers boolean NOT NULL DEFAULT false;

-- Create serial_numbers table
CREATE TABLE public.serial_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  serial_number text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  batch_id uuid REFERENCES public.stock_batches(id) ON DELETE SET NULL,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  movement_id uuid REFERENCES public.stock_movements(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  notes text,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  sold_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(product_id, serial_number)
);

-- Indexes
CREATE INDEX idx_serial_numbers_product_id ON public.serial_numbers(product_id);
CREATE INDEX idx_serial_numbers_serial_number ON public.serial_numbers(serial_number);
CREATE INDEX idx_serial_numbers_status ON public.serial_numbers(status);
CREATE INDEX idx_serial_numbers_order_id ON public.serial_numbers(order_id);

-- Enable RLS
ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Allowed users can view serial numbers"
ON public.serial_numbers FOR SELECT
TO public
USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert serial numbers"
ON public.serial_numbers FOR INSERT
TO public
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update serial numbers"
ON public.serial_numbers FOR UPDATE
TO public
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete serial numbers"
ON public.serial_numbers FOR DELETE
TO public
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

-- Update trigger
CREATE TRIGGER update_serial_numbers_updated_at
BEFORE UPDATE ON public.serial_numbers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
