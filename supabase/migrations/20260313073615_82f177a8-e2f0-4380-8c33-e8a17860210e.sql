
-- 1. Add weight and dimensions to inventory_products
ALTER TABLE public.inventory_products
  ADD COLUMN IF NOT EXISTS weight_kg numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS length_cm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS width_cm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS height_cm numeric DEFAULT NULL;

-- 2. Add inventory_product_id to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS inventory_product_id uuid REFERENCES public.inventory_products(id) ON DELETE SET NULL DEFAULT NULL;

-- 3. Create supplier_products table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  supplier_sku text DEFAULT NULL,
  supplier_price numeric DEFAULT 0,
  lead_time_days integer DEFAULT NULL,
  is_preferred boolean DEFAULT false,
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, product_id)
);

ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view supplier_products"
  ON public.supplier_products FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert supplier_products"
  ON public.supplier_products FOR INSERT
  WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update supplier_products"
  ON public.supplier_products FOR UPDATE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete supplier_products"
  ON public.supplier_products FOR DELETE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Update get_inventory_stats to include weight info
CREATE OR REPLACE FUNCTION public.get_inventory_stats()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM inventory_products),
    'activeProducts', (SELECT count(*) FROM inventory_products WHERE is_active = true),
    'lowStockProducts', (SELECT count(*) FROM inventory_products WHERE current_stock <= COALESCE(min_stock_level, 0) AND current_stock > 0 AND COALESCE(min_stock_level, 0) > 0),
    'outOfStockProducts', (SELECT count(*) FROM inventory_products WHERE current_stock <= 0),
    'totalStockValue', COALESCE((SELECT sum(current_stock * COALESCE(purchase_price, 0)) FROM inventory_products), 0),
    'totalSaleValue', COALESCE((SELECT sum(current_stock * COALESCE(sale_price, 0)) FROM inventory_products), 0),
    'totalReserved', COALESCE((SELECT sum(reserved_stock) FROM inventory_products), 0),
    'totalCurrent', COALESCE((SELECT sum(current_stock) FROM inventory_products), 0),
    'productsWithReservations', (SELECT count(*) FROM inventory_products WHERE reserved_stock > 0),
    'suppliersCount', (SELECT count(*) FROM suppliers),
    'totalWeight', COALESCE((SELECT sum(current_stock * COALESCE(weight_kg, 0)) FROM inventory_products WHERE weight_kg IS NOT NULL), 0)
  );
$$;
