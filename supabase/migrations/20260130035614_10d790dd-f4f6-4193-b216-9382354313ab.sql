-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for role_permissions
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
USING (is_admin(auth.jwt() ->> 'email'))
WITH CHECK (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_email TEXT, _module TEXT, _action TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_users au
    JOIN public.role_permissions rp ON au.role = rp.role
    WHERE au.email = _email
      AND rp.module = _module
      AND CASE
        WHEN _action = 'view' THEN rp.can_view
        WHEN _action = 'create' THEN rp.can_create
        WHEN _action = 'edit' THEN rp.can_edit
        WHEN _action = 'delete' THEN rp.can_delete
        ELSE false
      END
  )
$$;

-- Create update trigger for role_permissions
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();