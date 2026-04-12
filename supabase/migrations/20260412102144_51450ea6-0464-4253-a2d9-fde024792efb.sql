-- Move pg_trgm to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate dependent indexes using extensions schema
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders USING gin (customer_name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_products_name ON public.inventory_products USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING gin (name extensions.gin_trgm_ops);