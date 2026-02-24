
-- Create return status enum-like and returns table
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'received', 'refunded', 'rejected')),
  reason text NOT NULL CHECK (reason IN ('defect', 'wrong_product', 'not_liked', 'damaged_delivery', 'other')),
  reason_details text,
  return_type text NOT NULL DEFAULT 'full' CHECK (return_type IN ('full', 'partial')),
  refund_amount numeric DEFAULT 0,
  refund_method text CHECK (refund_method IN ('cash', 'card', 'bank_transfer', 'store_credit')),
  credit_note_id uuid REFERENCES public.credit_notes(id) ON DELETE SET NULL,
  stock_restored boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Return items for partial returns
CREATE TABLE public.return_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id uuid NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  catalog_number text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  reason text,
  condition text DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective', 'used')),
  restock boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for returns
CREATE POLICY "Allowed users can view returns" ON public.returns FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert returns" ON public.returns FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'create'::text));
CREATE POLICY "Users with edit permission can update returns" ON public.returns FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'edit'::text));
CREATE POLICY "Users with delete permission can delete returns" ON public.returns FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'delete'::text));

-- RLS policies for return_items
CREATE POLICY "Allowed users can view return items" ON public.return_items FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert return items" ON public.return_items FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'create'::text));
CREATE POLICY "Users with edit permission can update return items" ON public.return_items FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'edit'::text));
CREATE POLICY "Users with delete permission can delete return items" ON public.return_items FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'delete'::text));

-- Indexes
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_created_at ON public.returns(created_at DESC);
CREATE INDEX idx_return_items_return_id ON public.return_items(return_id);

-- Trigger for updated_at
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.returns;
