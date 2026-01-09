-- Add login_background_color column to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN login_background_color text DEFAULT NULL;