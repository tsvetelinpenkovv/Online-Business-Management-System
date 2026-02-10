
-- Fix argument order: has_permission(_email, _module, _action)

-- === ORDERS ===
DROP POLICY IF EXISTS "Users with create permission can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users with edit permission can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users with delete permission can delete orders" ON public.orders;

CREATE POLICY "Users with create permission can insert orders"
ON public.orders FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'create'));

CREATE POLICY "Users with edit permission can update orders"
ON public.orders FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'edit'));

CREATE POLICY "Users with delete permission can delete orders"
ON public.orders FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'delete'));

-- === INVENTORY PRODUCTS ===
DROP POLICY IF EXISTS "Users with create permission can insert products" ON public.inventory_products;
DROP POLICY IF EXISTS "Users with edit permission can update products" ON public.inventory_products;
DROP POLICY IF EXISTS "Users with delete permission can delete products" ON public.inventory_products;

CREATE POLICY "Users with create permission can insert products"
ON public.inventory_products FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));

CREATE POLICY "Users with edit permission can update products"
ON public.inventory_products FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));

CREATE POLICY "Users with delete permission can delete products"
ON public.inventory_products FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- === SUPPLIERS ===
DROP POLICY IF EXISTS "Users with create permission can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users with edit permission can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users with delete permission can delete suppliers" ON public.suppliers;

CREATE POLICY "Users with create permission can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));

CREATE POLICY "Users with edit permission can update suppliers"
ON public.suppliers FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));

CREATE POLICY "Users with delete permission can delete suppliers"
ON public.suppliers FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- === INVENTORY CATEGORIES ===
DROP POLICY IF EXISTS "Users with create permission can insert categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users with edit permission can update categories" ON public.inventory_categories;
DROP POLICY IF EXISTS "Users with delete permission can delete categories" ON public.inventory_categories;

CREATE POLICY "Users with create permission can insert categories"
ON public.inventory_categories FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));

CREATE POLICY "Users with edit permission can update categories"
ON public.inventory_categories FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));

CREATE POLICY "Users with delete permission can delete categories"
ON public.inventory_categories FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- === STOCK DOCUMENTS ===
DROP POLICY IF EXISTS "Users with create permission can insert documents" ON public.stock_documents;
DROP POLICY IF EXISTS "Users with edit permission can update documents" ON public.stock_documents;
DROP POLICY IF EXISTS "Users with delete permission can delete documents" ON public.stock_documents;

CREATE POLICY "Users with create permission can insert documents"
ON public.stock_documents FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));

CREATE POLICY "Users with edit permission can update documents"
ON public.stock_documents FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));

CREATE POLICY "Users with delete permission can delete documents"
ON public.stock_documents FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- === STOCK MOVEMENTS ===
DROP POLICY IF EXISTS "Users with create permission can insert movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users with edit permission can update movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users with delete permission can delete movements" ON public.stock_movements;

CREATE POLICY "Users with create permission can insert movements"
ON public.stock_movements FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));

CREATE POLICY "Users with edit permission can update movements"
ON public.stock_movements FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));

CREATE POLICY "Users with delete permission can delete movements"
ON public.stock_movements FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- === EXPENSES ===
DROP POLICY IF EXISTS "Users with create permission can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users with edit permission can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users with delete permission can delete expenses" ON public.expenses;

CREATE POLICY "Users with create permission can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'create'));

CREATE POLICY "Users with edit permission can update expenses"
ON public.expenses FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'edit'));

CREATE POLICY "Users with delete permission can delete expenses"
ON public.expenses FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'delete'));

-- === SHIPMENTS ===
DROP POLICY IF EXISTS "Users with create permission can insert shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users with edit permission can update shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users with delete permission can delete shipments" ON public.shipments;

CREATE POLICY "Users with create permission can insert shipments"
ON public.shipments FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'create'));

CREATE POLICY "Users with edit permission can update shipments"
ON public.shipments FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'edit'));

CREATE POLICY "Users with delete permission can delete shipments"
ON public.shipments FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'delete'));

-- === ORDER ITEMS ===
DROP POLICY IF EXISTS "Users with create permission can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users with edit permission can update order items" ON public.order_items;
DROP POLICY IF EXISTS "Users with delete permission can delete order items" ON public.order_items;

CREATE POLICY "Users with create permission can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'create'));

CREATE POLICY "Users with edit permission can update order items"
ON public.order_items FOR UPDATE
USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'edit'));

CREATE POLICY "Users with delete permission can delete order items"
ON public.order_items FOR DELETE
USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'delete'));
