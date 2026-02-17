
-- Fix stock_batches: replace broad auth with permission checks
DROP POLICY IF EXISTS "Authenticated users can manage batches" ON public.stock_batches;
DROP POLICY IF EXISTS "Authenticated users can view batches" ON public.stock_batches;

CREATE POLICY "Allowed users can view batches" ON public.stock_batches
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert batches" ON public.stock_batches
  FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update batches" ON public.stock_batches
  FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete batches" ON public.stock_batches
  FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

-- Fix product_bundles: replace broad auth with permission checks
DROP POLICY IF EXISTS "Authenticated users can manage bundles" ON public.product_bundles;
DROP POLICY IF EXISTS "Authenticated users can view bundles" ON public.product_bundles;

CREATE POLICY "Allowed users can view bundles" ON public.product_bundles
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert bundles" ON public.product_bundles
  FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update bundles" ON public.product_bundles
  FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete bundles" ON public.product_bundles
  FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

-- Fix stock_by_warehouse: replace broad auth with permission checks
DROP POLICY IF EXISTS "Authenticated users can manage stock_by_warehouse" ON public.stock_by_warehouse;
DROP POLICY IF EXISTS "Authenticated users can view stock_by_warehouse" ON public.stock_by_warehouse;

CREATE POLICY "Allowed users can view stock_by_warehouse" ON public.stock_by_warehouse
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert stock_by_warehouse" ON public.stock_by_warehouse
  FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with edit permission can update stock_by_warehouse" ON public.stock_by_warehouse
  FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with delete permission can delete stock_by_warehouse" ON public.stock_by_warehouse
  FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

-- Fix warehouses: replace broad auth with admin-only management
DROP POLICY IF EXISTS "Authenticated users can manage warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;

CREATE POLICY "Allowed users can view warehouses" ON public.warehouses
  FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can insert warehouses" ON public.warehouses
  FOR INSERT WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can update warehouses" ON public.warehouses
  FOR UPDATE USING (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can delete warehouses" ON public.warehouses
  FOR DELETE USING (is_admin((auth.jwt() ->> 'email'::text)));
