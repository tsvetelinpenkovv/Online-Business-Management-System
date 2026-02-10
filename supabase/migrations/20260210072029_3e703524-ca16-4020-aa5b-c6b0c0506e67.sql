
-- Fix: customers table - restrict SELECT to verified allowed users only
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Allowed users can view customers"
ON public.customers FOR SELECT TO authenticated
USING (public.is_allowed_user(auth.jwt() ->> 'email'));

-- Fix: invoices table - restrict SELECT to verified allowed users only
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
CREATE POLICY "Allowed users can view invoices"
ON public.invoices FOR SELECT TO authenticated
USING (public.is_allowed_user(auth.jwt() ->> 'email'));

-- Fix: shipments table - restrict SELECT to verified allowed users only
DROP POLICY IF EXISTS "Authenticated users can view shipments" ON public.shipments;
CREATE POLICY "Allowed users can view shipments"
ON public.shipments FOR SELECT TO authenticated
USING (public.is_allowed_user(auth.jwt() ->> 'email'));

-- Fix: customer_notes table - restrict SELECT to verified allowed users only
DROP POLICY IF EXISTS "Authenticated users can view customer notes" ON public.customer_notes;
CREATE POLICY "Allowed users can view customer notes"
ON public.customer_notes FOR SELECT TO authenticated
USING (public.is_allowed_user(auth.jwt() ->> 'email'));
