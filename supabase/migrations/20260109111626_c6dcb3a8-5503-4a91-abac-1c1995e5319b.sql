-- Add footer settings columns to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS footer_text text DEFAULT 'Разработен от Цветелин Пенков',
ADD COLUMN IF NOT EXISTS footer_website text DEFAULT 'www.penkovstudio.eu';