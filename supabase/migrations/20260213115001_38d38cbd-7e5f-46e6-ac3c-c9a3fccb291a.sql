
-- =====================================================
-- FIX 1: orders - Restrict SELECT to allowed users only
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "Allowed users can view orders"
  ON public.orders FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 2: suppliers - Restrict SELECT to allowed users only
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
CREATE POLICY "Allowed users can view suppliers"
  ON public.suppliers FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 3: stock_movements - Restrict SELECT to allowed users only
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.stock_movements;
CREATE POLICY "Allowed users can view movements"
  ON public.stock_movements FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 4: connectix_messages - Restrict SELECT & INSERT to allowed users
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view messages" ON public.connectix_messages;
CREATE POLICY "Allowed users can view messages"
  ON public.connectix_messages FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.connectix_messages;
CREATE POLICY "Allowed users can insert messages"
  ON public.connectix_messages FOR INSERT
  WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 5: shipments - Remove duplicate permissive SELECT policy
-- =====================================================
DROP POLICY IF EXISTS "Shipments viewable by authenticated users" ON public.shipments;

-- =====================================================
-- FIX 6: customers - Replace overly broad ALL policy with specific CUD policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Allowed users can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can update customers"
  ON public.customers FOR UPDATE
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can delete customers"
  ON public.customers FOR DELETE
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 7: customer_notes - Replace overly broad ALL policy with specific CUD policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage customer notes" ON public.customer_notes;
CREATE POLICY "Allowed users can insert customer notes"
  ON public.customer_notes FOR INSERT
  WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can update customer notes"
  ON public.customer_notes FOR UPDATE
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can delete customer notes"
  ON public.customer_notes FOR DELETE
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- =====================================================
-- FIX 8: invoices - Restrict INSERT to allowed users
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can insert invoices" ON public.invoices;
CREATE POLICY "Allowed users can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
