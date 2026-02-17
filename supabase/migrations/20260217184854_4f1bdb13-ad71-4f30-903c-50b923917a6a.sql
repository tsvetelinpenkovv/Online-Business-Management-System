-- Add DELETE policy for invoices table
CREATE POLICY "Allowed users can delete invoices"
ON public.invoices
FOR DELETE
USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- Add UPDATE policy for invoices table (also missing)
CREATE POLICY "Allowed users can update invoices"
ON public.invoices
FOR UPDATE
USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- Add DELETE policy for audit_logs (needed for factory reset)
CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
USING (is_admin((auth.jwt() ->> 'email'::text)));