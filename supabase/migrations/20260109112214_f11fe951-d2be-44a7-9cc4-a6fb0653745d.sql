-- Add footer link column to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS footer_link text DEFAULT 'https://www.linkedin.com/in/tsvetelinpenkov/';