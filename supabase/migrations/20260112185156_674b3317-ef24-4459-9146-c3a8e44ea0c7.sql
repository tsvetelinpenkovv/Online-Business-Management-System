-- 1. Create trigger for bundle component deduction (function exists but trigger missing)
CREATE TRIGGER trigger_deduct_bundle_components
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION deduct_bundle_components();

-- 2. Create trigger for automatic stock updates
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- 3. Add reserved_stock column to inventory_products for tracking reserved quantities
ALTER TABLE inventory_products 
ADD COLUMN IF NOT EXISTS reserved_stock numeric NOT NULL DEFAULT 0;

-- 4. Add stock_deducted flag to orders to prevent double deduction
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;

-- 5. Create setting for stock deduction status if not exists
INSERT INTO api_settings (setting_key, setting_value)
VALUES ('stock_deduction_status', 'Изпратена')
ON CONFLICT (setting_key) DO NOTHING;

-- 6. Create setting for cancelled status that restores stock
INSERT INTO api_settings (setting_key, setting_value)
VALUES ('stock_restore_status', 'Отказана')
ON CONFLICT (setting_key) DO NOTHING;