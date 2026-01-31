-- Add call_status column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS call_status text DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.orders.call_status IS 'Status of phone call attempts: none, no_answer, busy, wrong_number, callback, called, confirmed';