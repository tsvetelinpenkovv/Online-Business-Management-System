
-- Drop existing overly-permissive ALL policies and replace with permission-checked ones

-- === ORDERS ===
-- Replace permissive INSERT/UPDATE/DELETE with permission-checked policies
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;

CREATE POLICY "Users with create permission can insert orders"
ON public.orders FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'orders'));

CREATE POLICY "Users with edit permission can update orders"
ON public.orders FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'orders'));

CREATE POLICY "Users with delete permission can delete orders"
ON public.orders FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'orders'));

-- === INVENTORY PRODUCTS ===
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.inventory_products;

CREATE POLICY "Users with create permission can insert products"
ON public.inventory_products FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with edit permission can update products"
ON public.inventory_products FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with delete permission can delete products"
ON public.inventory_products FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'inventory'));

-- === SUPPLIERS ===
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;

CREATE POLICY "Users with create permission can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with edit permission can update suppliers"
ON public.suppliers FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with delete permission can delete suppliers"
ON public.suppliers FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'inventory'));

-- === INVENTORY CATEGORIES ===
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.inventory_categories;

CREATE POLICY "Users with create permission can insert categories"
ON public.inventory_categories FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with edit permission can update categories"
ON public.inventory_categories FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with delete permission can delete categories"
ON public.inventory_categories FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'inventory'));

-- === STOCK DOCUMENTS ===
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.stock_documents;

CREATE POLICY "Users with create permission can insert documents"
ON public.stock_documents FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with edit permission can update documents"
ON public.stock_documents FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with delete permission can delete documents"
ON public.stock_documents FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'inventory'));

-- === STOCK MOVEMENTS ===
DROP POLICY IF EXISTS "Authenticated users can manage movements" ON public.stock_movements;

CREATE POLICY "Users with create permission can insert movements"
ON public.stock_movements FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with edit permission can update movements"
ON public.stock_movements FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'inventory'));

CREATE POLICY "Users with delete permission can delete movements"
ON public.stock_movements FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'inventory'));

-- === EXPENSES ===
DROP POLICY IF EXISTS "Authenticated users can manage expenses" ON public.expenses;

CREATE POLICY "Users with create permission can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'invoices'));

CREATE POLICY "Users with edit permission can update expenses"
ON public.expenses FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'invoices'));

CREATE POLICY "Users with delete permission can delete expenses"
ON public.expenses FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'invoices'));

-- === SHIPMENTS ===
DROP POLICY IF EXISTS "Shipments can be modified by authenticated users" ON public.shipments;

CREATE POLICY "Users with create permission can insert shipments"
ON public.shipments FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'shipments'));

CREATE POLICY "Users with edit permission can update shipments"
ON public.shipments FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'shipments'));

CREATE POLICY "Users with delete permission can delete shipments"
ON public.shipments FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'shipments'));

-- === ORDER ITEMS (follows orders permissions) ===
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

CREATE POLICY "Users with create permission can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (has_permission('create', (auth.jwt() ->> 'email'::text), 'orders'));

CREATE POLICY "Users with edit permission can update order items"
ON public.order_items FOR UPDATE
USING (has_permission('edit', (auth.jwt() ->> 'email'::text), 'orders'));

CREATE POLICY "Users with delete permission can delete order items"
ON public.order_items FOR DELETE
USING (has_permission('delete', (auth.jwt() ->> 'email'::text), 'orders'));
