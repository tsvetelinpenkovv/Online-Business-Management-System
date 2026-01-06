-- Add url_pattern column to couriers for matching tracking URLs
ALTER TABLE public.couriers ADD COLUMN url_pattern text;

-- Update default couriers with their URL patterns
UPDATE public.couriers SET url_pattern = 'econt.com' WHERE name = 'Еконт';
UPDATE public.couriers SET url_pattern = 'speedy.bg' WHERE name = 'Спиди';
UPDATE public.couriers SET url_pattern = 'boxnow.bg' WHERE name = 'Box Now';