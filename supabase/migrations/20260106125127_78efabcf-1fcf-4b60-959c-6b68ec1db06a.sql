-- Tighten RLS for allowed_users to avoid exposing all emails to any logged-in user

DROP POLICY IF EXISTS "Authenticated users can view allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can insert allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can update allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can delete allowed_users" ON public.allowed_users;

-- SELECT: user can only see their own row
CREATE POLICY "Users can view own allowed_users row"
ON public.allowed_users
FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- SELECT: admins can view all rows
CREATE POLICY "Admins can view all allowed_users"
ON public.allowed_users
FOR SELECT
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

-- INSERT: only admins
CREATE POLICY "Admins can insert allowed_users"
ON public.allowed_users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

-- UPDATE: only admins
CREATE POLICY "Admins can update allowed_users"
ON public.allowed_users
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'))
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

-- DELETE: only admins (but not themselves)
CREATE POLICY "Admins can delete allowed_users"
ON public.allowed_users
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.jwt() ->> 'email')
  AND email <> auth.jwt() ->> 'email'
);
