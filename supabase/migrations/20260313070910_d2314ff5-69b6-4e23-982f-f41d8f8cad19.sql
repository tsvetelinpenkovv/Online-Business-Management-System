
-- Server-side inventory stats function
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
    'suppliersCount', (SELECT count(*) FROM suppliers)
  );
$$;

-- SKU unique constraint
ALTER TABLE public.inventory_products ADD CONSTRAINT unique_sku UNIQUE (sku);
