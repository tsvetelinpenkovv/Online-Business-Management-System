-- Step 1: Only extend the enum with new values
-- These must be committed before use
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse_worker';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_operator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance';