-- Add secret path column to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS secret_path TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.company_settings.secret_path IS 'Secret URL path for additional security (e.g., /b36s739rbf)';