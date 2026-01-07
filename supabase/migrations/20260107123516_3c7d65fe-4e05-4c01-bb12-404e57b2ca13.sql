-- Add website_url field to company_settings table
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add comment for the column
COMMENT ON COLUMN public.company_settings.website_url IS 'Website URL to display in header';