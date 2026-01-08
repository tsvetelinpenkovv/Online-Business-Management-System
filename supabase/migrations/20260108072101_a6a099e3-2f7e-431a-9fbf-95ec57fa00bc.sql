-- Categories for products
CREATE TABLE public.inventory_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    parent_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unit of measure
CREATE TABLE public.units_of_measure (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default units
INSERT INTO public.units_of_measure (name, abbreviation) VALUES
    ('Брой', 'бр.'),
    ('Килограм', 'кг'),
    ('Грам', 'гр'),
    ('Литър', 'л'),
    ('Метър', 'м'),
    ('Квадратен метър', 'м²'),
    ('Кубически метър', 'м³'),
    ('Опаковка', 'оп.'),
    ('Комплект', 'к-т');

-- Suppliers
CREATE TABLE public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    eik text,
    vat_number text,
    notes text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products/Items for inventory
CREATE TABLE public.inventory_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sku text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    category_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
    unit_id uuid REFERENCES public.units_of_measure(id) ON DELETE SET NULL,
    purchase_price numeric(12,2) DEFAULT 0,
    sale_price numeric(12,2) DEFAULT 0,
    min_stock_level numeric(12,3) DEFAULT 0,
    current_stock numeric(12,3) NOT NULL DEFAULT 0,
    woocommerce_id integer,
    barcode text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stock batches for traceability
CREATE TABLE public.stock_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
    batch_number text NOT NULL,
    supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
    quantity numeric(12,3) NOT NULL DEFAULT 0,
    remaining_quantity numeric(12,3) NOT NULL DEFAULT 0,
    purchase_price numeric(12,2),
    expiry_date date,
    received_date date NOT NULL DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stock movement types
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'return');

-- Stock document types
CREATE TYPE public.document_type AS ENUM ('receiving', 'dispatch', 'adjustment', 'return', 'inventory');

-- Stock documents (приемателни, разходни и др.)
CREATE TABLE public.stock_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number text NOT NULL UNIQUE,
    document_type document_type NOT NULL,
    document_date date NOT NULL DEFAULT CURRENT_DATE,
    supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
    counterparty_name text,
    notes text,
    total_amount numeric(12,2) DEFAULT 0,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stock movements (individual line items)
CREATE TABLE public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES public.stock_documents(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE RESTRICT,
    batch_id uuid REFERENCES public.stock_batches(id) ON DELETE SET NULL,
    movement_type movement_type NOT NULL,
    quantity numeric(12,3) NOT NULL,
    unit_price numeric(12,2) DEFAULT 0,
    total_price numeric(12,2) DEFAULT 0,
    stock_before numeric(12,3) NOT NULL DEFAULT 0,
    stock_after numeric(12,3) NOT NULL DEFAULT 0,
    reason text,
    created_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Sequence for document numbers
CREATE SEQUENCE IF NOT EXISTS stock_document_seq START 1;

-- Function to generate document number
CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type document_type)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    prefix text;
    seq_num integer;
BEGIN
    CASE doc_type
        WHEN 'receiving' THEN prefix := 'ПП';
        WHEN 'dispatch' THEN prefix := 'РП';
        WHEN 'adjustment' THEN prefix := 'КР';
        WHEN 'return' THEN prefix := 'ВР';
        WHEN 'inventory' THEN prefix := 'ИН';
    END CASE;
    
    seq_num := nextval('stock_document_seq');
    RETURN prefix || '-' || to_char(CURRENT_DATE, 'YYMM') || '-' || lpad(seq_num::text, 5, '0');
END;
$$;

-- Function to update product stock after movement
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'in' OR NEW.movement_type = 'return' THEN
            UPDATE public.inventory_products 
            SET current_stock = current_stock + NEW.quantity,
                updated_at = now()
            WHERE id = NEW.product_id;
        ELSIF NEW.movement_type = 'out' THEN
            UPDATE public.inventory_products 
            SET current_stock = current_stock - NEW.quantity,
                updated_at = now()
            WHERE id = NEW.product_id;
        ELSIF NEW.movement_type = 'adjustment' THEN
            UPDATE public.inventory_products 
            SET current_stock = NEW.stock_after,
                updated_at = now()
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for stock updates
CREATE TRIGGER on_stock_movement_insert
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock();

-- Enable RLS on all tables
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can view categories" ON public.inventory_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories" ON public.inventory_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view units" ON public.units_of_measure FOR SELECT USING (true);
CREATE POLICY "Admins can manage units" ON public.units_of_measure FOR ALL USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view products" ON public.inventory_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage products" ON public.inventory_products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view batches" ON public.stock_batches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage batches" ON public.stock_batches FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view documents" ON public.stock_documents FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage documents" ON public.stock_documents FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view movements" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage movements" ON public.stock_movements FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON public.inventory_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_products_updated_at BEFORE UPDATE ON public.inventory_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_batches_updated_at BEFORE UPDATE ON public.stock_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_documents_updated_at BEFORE UPDATE ON public.stock_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();