-- Create product_bundles table to store bundle/kit relationships
CREATE TABLE public.product_bundles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
    component_quantity NUMERIC NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(parent_product_id, component_product_id)
);

-- Add comment for clarity
COMMENT ON TABLE public.product_bundles IS 'Stores bundle/kit relationships between products. Parent is the bundle, component is what it contains.';

-- Add is_bundle column to inventory_products to mark products as bundles
ALTER TABLE public.inventory_products 
ADD COLUMN is_bundle BOOLEAN NOT NULL DEFAULT false;

-- Add external_bundle_type column to track the type of bundle from e-commerce platforms
ALTER TABLE public.inventory_products 
ADD COLUMN external_bundle_type TEXT;

COMMENT ON COLUMN public.inventory_products.is_bundle IS 'Indicates if this product is a bundle/kit containing other products';
COMMENT ON COLUMN public.inventory_products.external_bundle_type IS 'Type of bundle from e-commerce platform (e.g., grouped, bundled, composite)';

-- Enable RLS on product_bundles
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for product_bundles
CREATE POLICY "Authenticated users can view bundles" 
ON public.product_bundles 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage bundles" 
ON public.product_bundles 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_product_bundles_updated_at
BEFORE UPDATE ON public.product_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to deduct bundle components when a bundle is sold
CREATE OR REPLACE FUNCTION public.deduct_bundle_components()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    bundle_record RECORD;
    current_product RECORD;
BEGIN
    -- Only process if this is an 'out' movement
    IF NEW.movement_type = 'out' THEN
        -- Check if the product is a bundle
        SELECT is_bundle INTO current_product FROM inventory_products WHERE id = NEW.product_id;
        
        IF current_product.is_bundle THEN
            -- Deduct stock from each component
            FOR bundle_record IN 
                SELECT pb.component_product_id, pb.component_quantity, ip.current_stock
                FROM product_bundles pb
                JOIN inventory_products ip ON ip.id = pb.component_product_id
                WHERE pb.parent_product_id = NEW.product_id
            LOOP
                -- Create a stock movement for each component
                INSERT INTO stock_movements (
                    product_id,
                    movement_type,
                    quantity,
                    reason,
                    stock_before,
                    stock_after,
                    document_id,
                    created_by
                ) VALUES (
                    bundle_record.component_product_id,
                    'out',
                    bundle_record.component_quantity * NEW.quantity,
                    'Автоматично изписване от комплект: ' || (SELECT name FROM inventory_products WHERE id = NEW.product_id),
                    bundle_record.current_stock,
                    bundle_record.current_stock - (bundle_record.component_quantity * NEW.quantity),
                    NEW.document_id,
                    NEW.created_by
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically deduct bundle components
CREATE TRIGGER deduct_bundle_components_trigger
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.deduct_bundle_components();

-- Add index for better performance
CREATE INDEX idx_product_bundles_parent ON public.product_bundles(parent_product_id);
CREATE INDEX idx_product_bundles_component ON public.product_bundles(component_product_id);
CREATE INDEX idx_inventory_products_is_bundle ON public.inventory_products(is_bundle) WHERE is_bundle = true;