-- Add login page customization fields to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS login_title text DEFAULT 'Управление на поръчки и складови наличности',
ADD COLUMN IF NOT EXISTS login_description text DEFAULT 'Влезте в системата за управление на поръчки и склад';