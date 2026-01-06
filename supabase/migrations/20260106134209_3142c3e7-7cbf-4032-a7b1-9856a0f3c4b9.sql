-- Add courier_id column to orders table
ALTER TABLE public.orders ADD COLUMN courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL;