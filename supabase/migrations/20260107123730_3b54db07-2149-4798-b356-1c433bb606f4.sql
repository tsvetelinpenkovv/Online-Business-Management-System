-- Create table for custom order statuses
CREATE TABLE public.order_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'primary',
  icon TEXT NOT NULL DEFAULT 'Clock',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies - all authenticated users can read
CREATE POLICY "Anyone can view order statuses" 
ON public.order_statuses 
FOR SELECT 
USING (true);

-- Only authenticated users can modify (will be further restricted by app logic for admins)
CREATE POLICY "Authenticated users can manage statuses" 
ON public.order_statuses 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Insert default statuses
INSERT INTO public.order_statuses (name, color, icon, sort_order, is_default) VALUES
  ('Нова', 'primary', 'Clock', 1, true),
  ('В обработка', 'info', 'Loader2', 2, true),
  ('Неуспешна връзка', 'warning', 'PhoneOff', 3, true),
  ('Потвърдена', 'success', 'CheckCircle2', 4, true),
  ('Платена с карта', 'purple', 'CreditCard', 5, true),
  ('На лизинг през TBI', 'teal', 'Building2', 6, true),
  ('На лизинг през BNP', 'teal', 'Building2', 7, true),
  ('Изпратена', 'warning', 'Truck', 8, true),
  ('Неуспешна доставка', 'destructive', 'PackageX', 9, true),
  ('Доставена', 'success', 'Package', 10, true),
  ('Завършена', 'success', 'CircleCheck', 11, true),
  ('Върната', 'muted', 'Undo2', 12, true),
  ('Отказана', 'destructive', 'XCircle', 13, true),
  ('Анулирана', 'muted', 'Ban', 14, true);