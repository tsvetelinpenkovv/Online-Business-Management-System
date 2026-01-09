-- Add page titles to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS orders_page_title TEXT DEFAULT 'Управление на поръчки',
ADD COLUMN IF NOT EXISTS inventory_page_title TEXT DEFAULT 'Склад';