-- Create storage bucket for login background
INSERT INTO storage.buckets (id, name, public)
VALUES ('login-backgrounds', 'login-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to view login backgrounds (public bucket)
CREATE POLICY "Login backgrounds are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'login-backgrounds');

-- Policy to allow admins to upload login backgrounds
CREATE POLICY "Admins can upload login backgrounds"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'login-backgrounds' 
  AND EXISTS (
    SELECT 1 FROM public.allowed_users 
    WHERE email = (auth.jwt() ->> 'email') 
    AND role = 'admin'
  )
);

-- Policy to allow admins to update login backgrounds
CREATE POLICY "Admins can update login backgrounds"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'login-backgrounds' 
  AND EXISTS (
    SELECT 1 FROM public.allowed_users 
    WHERE email = (auth.jwt() ->> 'email') 
    AND role = 'admin'
  )
);

-- Policy to allow admins to delete login backgrounds
CREATE POLICY "Admins can delete login backgrounds"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'login-backgrounds' 
  AND EXISTS (
    SELECT 1 FROM public.allowed_users 
    WHERE email = (auth.jwt() ->> 'email') 
    AND role = 'admin'
  )
);