-- Add footer link text column to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS footer_link_text text DEFAULT 'Цветелин Пенков';

-- Update footer_text to be just the prefix
UPDATE public.company_settings 
SET footer_text = 'Разработен от' 
WHERE footer_text = 'Разработен от Цветелин Пенков' OR footer_text IS NULL;