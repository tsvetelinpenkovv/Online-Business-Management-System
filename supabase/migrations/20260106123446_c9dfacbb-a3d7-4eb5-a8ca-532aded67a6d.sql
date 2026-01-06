-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create allowed_users table
CREATE TABLE public.allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_users
    WHERE email = _email
      AND role = 'admin'
  )
$$;

-- Create function to check if user is allowed
CREATE OR REPLACE FUNCTION public.is_allowed_user(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_users
    WHERE email = _email
  )
$$;

-- RLS policies for allowed_users
-- Everyone authenticated can view (needed to check if they're allowed)
CREATE POLICY "Authenticated users can view allowed_users"
ON public.allowed_users
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert new users
CREATE POLICY "Admins can insert allowed_users"
ON public.allowed_users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.jwt() ->> 'email'));

-- Only admins can update users
CREATE POLICY "Admins can update allowed_users"
ON public.allowed_users
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.jwt() ->> 'email'));

-- Only admins can delete users (but not themselves)
CREATE POLICY "Admins can delete allowed_users"
ON public.allowed_users
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.jwt() ->> 'email') 
  AND email != auth.jwt() ->> 'email'
);

-- Insert the main admin
INSERT INTO public.allowed_users (email, name, role)
VALUES ('tsvetelinppk@gmail.com', 'Tsvetelin Penkov', 'admin');