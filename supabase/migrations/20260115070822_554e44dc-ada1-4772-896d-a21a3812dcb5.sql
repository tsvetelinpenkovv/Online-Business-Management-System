-- =============================================
-- 1. WAREHOUSES TABLE (Multi-location support)
-- =============================================
CREATE TABLE public.warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    code text NOT NULL UNIQUE,
    address text,
    city text,
    phone text,
    is_default boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view warehouses"
ON public.warehouses FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage warehouses"
ON public.warehouses FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- 2. STOCK BY WAREHOUSE TABLE
-- =============================================
CREATE TABLE public.stock_by_warehouse (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
    warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    current_stock numeric(12,3) NOT NULL DEFAULT 0,
    reserved_stock numeric(12,3) NOT NULL DEFAULT 0,
    min_stock_level numeric(12,3) DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(product_id, warehouse_id)
);

-- Enable RLS
ALTER TABLE public.stock_by_warehouse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock_by_warehouse"
ON public.stock_by_warehouse FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage stock_by_warehouse"
ON public.stock_by_warehouse FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add warehouse_id to stock_movements for tracking
ALTER TABLE public.stock_movements ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL;

-- =============================================
-- 3. AUDIT LOG TABLE
-- =============================================
CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email text,
    action text NOT NULL,
    table_name text NOT NULL,
    record_id text,
    old_data jsonb,
    new_data jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

-- =============================================
-- 4. ADD multi_warehouse_enabled TO API_SETTINGS
-- =============================================
INSERT INTO public.api_settings (setting_key, setting_value)
VALUES ('multi_warehouse_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- 5. TRIGGER FOR UPDATING updated_at
-- =============================================
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_by_warehouse_updated_at
BEFORE UPDATE ON public.stock_by_warehouse
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();