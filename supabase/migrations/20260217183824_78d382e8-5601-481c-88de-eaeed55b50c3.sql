
-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders (phone);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source);
CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders (code);
CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted ON public.orders (stock_deducted);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders USING gin (customer_name gin_trgm_ops);

-- Inventory products indexes
CREATE INDEX IF NOT EXISTS idx_inventory_products_sku ON public.inventory_products (sku);
CREATE INDEX IF NOT EXISTS idx_inventory_products_barcode ON public.inventory_products (barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_products_category ON public.inventory_products (category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_active ON public.inventory_products (is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_products_woocommerce_id ON public.inventory_products (woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_inventory_products_current_stock ON public.inventory_products (current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_products_name ON public.inventory_products USING gin (name gin_trgm_ops);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_last_order_date ON public.customers (last_order_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING gin (name gin_trgm_ops);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_catalog_number ON public.order_items (catalog_number);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_document_id ON public.stock_movements (document_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse_id ON public.stock_movements (warehouse_id);

-- Shipments indexes
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments (order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_waybill ON public.shipments (waybill_number);

-- Stock by warehouse indexes
CREATE INDEX IF NOT EXISTS idx_stock_by_warehouse_product ON public.stock_by_warehouse (product_id);
CREATE INDEX IF NOT EXISTS idx_stock_by_warehouse_warehouse ON public.stock_by_warehouse (warehouse_id);

-- Price history indexes
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.price_history (product_id);

-- Connectix messages indexes
CREATE INDEX IF NOT EXISTS idx_connectix_messages_order_id ON public.connectix_messages (order_id);
