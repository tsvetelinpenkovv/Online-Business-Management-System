-- ============================================================
-- OBM System v3.0 - Full Schema Export
-- Generated: 2026-02-23
-- Target: PostgreSQL 15+ (Supabase)
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================================
-- 2. CUSTOM TYPES (ENUMS)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'warehouse_worker', 'order_operator', 'finance');
CREATE TYPE public.document_type AS ENUM ('receiving', 'dispatch', 'adjustment', 'return', 'inventory');
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'return', 'transfer');

-- ============================================================
-- 3. SEQUENCES
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.orders_id_seq AS bigint START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS public.stock_document_seq AS bigint START WITH 1 INCREMENT BY 1;

-- ============================================================
-- 4. TABLES
-- ============================================================

-- allowed_users
CREATE TABLE public.allowed_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user'::app_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- api_settings
CREATE TABLE public.api_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- company_settings
CREATE TABLE public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text,
  eik text,
  registered_address text,
  correspondence_address text,
  manager_name text,
  vat_number text,
  vat_registered boolean DEFAULT false,
  email text,
  phone text,
  bank_name text,
  bank_iban text,
  bank_bic text,
  website_url text,
  next_invoice_number integer DEFAULT 1,
  orders_page_title text DEFAULT 'Управление на поръчки',
  inventory_page_title text DEFAULT 'Склад',
  footer_text text DEFAULT 'Разработен от Цветелин Пенков',
  footer_website text DEFAULT 'www.penkovstudio.eu',
  footer_link text DEFAULT 'https://www.linkedin.com/in/tsvetelinpenkov/',
  footer_link_text text DEFAULT 'Цветелин Пенков',
  login_title text DEFAULT 'Управление на поръчки и складови наличности',
  login_description text DEFAULT 'Влезте в системата за управление на поръчки и склад',
  login_background_color text,
  secret_path text,
  multi_store_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- couriers
CREATE TABLE public.couriers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  logo_url text,
  url_pattern text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- courier_api_settings
CREATE TABLE public.courier_api_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id uuid NOT NULL UNIQUE REFERENCES public.couriers(id),
  api_url text,
  username text,
  password text,
  client_id text,
  client_secret text,
  api_key text,
  is_test_mode boolean DEFAULT true,
  is_enabled boolean DEFAULT false,
  extra_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- customers
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  city text,
  tags text[] DEFAULT '{}'::text[],
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  first_order_date timestamptz,
  last_order_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- customer_notes
CREATE TABLE public.customer_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  note text NOT NULL,
  created_by uuid,
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- stores
CREATE TABLE public.stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  country_code text NOT NULL,
  country_name text NOT NULL,
  flag_emoji text NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  currency_symbol text NOT NULL DEFAULT '€',
  wc_url text,
  wc_consumer_key text,
  wc_consumer_secret text,
  wc_webhook_secret text,
  is_enabled boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE public.orders (
  id bigint NOT NULL DEFAULT nextval('orders_id_seq') PRIMARY KEY,
  code text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  customer_email text,
  product_name text NOT NULL,
  catalog_number text,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  delivery_address text,
  status text NOT NULL DEFAULT 'Нова',
  comment text,
  source text DEFAULT 'woocommerce',
  is_correct boolean DEFAULT true,
  courier_id uuid REFERENCES public.couriers(id),
  courier_tracking_url text,
  user_id uuid,
  stock_deducted boolean NOT NULL DEFAULT false,
  paid_amount numeric NOT NULL DEFAULT 0,
  payment_date timestamptz,
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text,
  currency text NOT NULL DEFAULT 'EUR',
  currency_symbol text NOT NULL DEFAULT '€',
  store_id uuid REFERENCES public.stores(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES public.orders(id),
  product_name text NOT NULL,
  catalog_number text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- order_statuses
CREATE TABLE public.order_statuses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'primary',
  icon text NOT NULL DEFAULT 'Clock',
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- connectix_messages
CREATE TABLE public.connectix_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id integer REFERENCES public.orders(id),
  phone text NOT NULL,
  customer_name text,
  channel text NOT NULL,
  template_id text,
  template_name text,
  message_id text,
  status text NOT NULL DEFAULT 'sent',
  trigger_type text,
  trigger_status text,
  error_message text,
  is_sandbox boolean DEFAULT false,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- invoices
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number integer NOT NULL,
  order_id bigint REFERENCES public.orders(id),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  tax_event_date date,
  seller_name text NOT NULL,
  seller_eik text,
  seller_address text,
  seller_vat_number text,
  buyer_name text NOT NULL,
  buyer_eik text,
  buyer_address text,
  buyer_vat_number text,
  buyer_phone text,
  buyer_email text,
  product_description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  vat_rate numeric DEFAULT 20,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- credit_notes
CREATE TABLE public.credit_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id),
  invoice_id uuid REFERENCES public.invoices(id),
  credit_note_number integer NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL,
  vat_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- expenses
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ecommerce_platforms
CREATE TABLE public.ecommerce_platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  logo_url text,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_categories
CREATE TABLE public.inventory_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.inventory_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- units_of_measure
CREATE TABLE public.units_of_measure (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  abbreviation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- inventory_products
CREATE TABLE public.inventory_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  barcode text,
  category_id uuid REFERENCES public.inventory_categories(id),
  unit_id uuid REFERENCES public.units_of_measure(id),
  purchase_price numeric DEFAULT 0,
  sale_price numeric DEFAULT 0,
  min_stock_level numeric DEFAULT 0,
  current_stock numeric NOT NULL DEFAULT 0,
  reserved_stock numeric NOT NULL DEFAULT 0,
  woocommerce_id integer,
  is_active boolean NOT NULL DEFAULT true,
  is_bundle boolean NOT NULL DEFAULT false,
  external_bundle_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- product_bundles
CREATE TABLE public.product_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  component_product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  component_quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- suppliers
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- warehouses
CREATE TABLE public.warehouses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL,
  address text,
  city text,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stock_by_warehouse
CREATE TABLE public.stock_by_warehouse (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  current_stock numeric NOT NULL DEFAULT 0,
  reserved_stock numeric NOT NULL DEFAULT 0,
  min_stock_level numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stock_batches
CREATE TABLE public.stock_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  batch_number text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  remaining_quantity numeric NOT NULL DEFAULT 0,
  purchase_price numeric,
  expiry_date date,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stock_documents
CREATE TABLE public.stock_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_number text NOT NULL,
  document_type public.document_type NOT NULL,
  document_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier_id uuid REFERENCES public.suppliers(id),
  counterparty_name text,
  total_amount numeric DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- stock_movements
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  document_id uuid REFERENCES public.stock_documents(id),
  batch_id uuid REFERENCES public.stock_batches(id),
  warehouse_id uuid REFERENCES public.warehouses(id),
  movement_type public.movement_type NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  stock_before numeric NOT NULL DEFAULT 0,
  stock_after numeric NOT NULL DEFAULT 0,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- price_history
CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id),
  field_changed text NOT NULL,
  old_value numeric,
  new_value numeric,
  reason text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- shipments
CREATE TABLE public.shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id integer REFERENCES public.orders(id),
  courier_id uuid NOT NULL REFERENCES public.couriers(id),
  waybill_number text NOT NULL,
  label_url text,
  status text DEFAULT 'created',
  sender_name text,
  sender_phone text,
  sender_address text,
  sender_city text,
  sender_office_code text,
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  recipient_address text,
  recipient_city text,
  recipient_office_code text,
  delivery_type text DEFAULT 'office',
  service_type text,
  weight numeric DEFAULT 1,
  cod_amount numeric DEFAULT 0,
  declared_value numeric DEFAULT 0,
  notes text,
  courier_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- role_permissions
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  module text NOT NULL,
  can_view boolean DEFAULT true,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- login_attempts
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  email text,
  success boolean NOT NULL DEFAULT false,
  attempt_time timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. INDEXES
-- ============================================================

-- audit_logs
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs USING btree (table_name);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

-- connectix_messages
CREATE INDEX idx_connectix_messages_order_id ON public.connectix_messages USING btree (order_id);
CREATE INDEX idx_connectix_messages_sent_at ON public.connectix_messages USING btree (sent_at DESC);
CREATE INDEX idx_connectix_messages_status ON public.connectix_messages USING btree (status);

-- customers
CREATE INDEX idx_customers_email ON public.customers USING btree (email);
CREATE INDEX idx_customers_last_order_date ON public.customers USING btree (last_order_date DESC NULLS LAST);
CREATE INDEX idx_customers_name ON public.customers USING gin (name gin_trgm_ops);
CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX idx_customers_tags ON public.customers USING gin (tags);

-- inventory_products
CREATE INDEX idx_inventory_products_active ON public.inventory_products USING btree (is_active);
CREATE INDEX idx_inventory_products_barcode ON public.inventory_products USING btree (barcode);
CREATE INDEX idx_inventory_products_category ON public.inventory_products USING btree (category_id);
CREATE INDEX idx_inventory_products_current_stock ON public.inventory_products USING btree (current_stock);
CREATE INDEX idx_inventory_products_is_bundle ON public.inventory_products USING btree (is_bundle) WHERE (is_bundle = true);
CREATE INDEX idx_inventory_products_name ON public.inventory_products USING gin (name gin_trgm_ops);
CREATE INDEX idx_inventory_products_sku ON public.inventory_products USING btree (sku);
CREATE INDEX idx_inventory_products_woocommerce_id ON public.inventory_products USING btree (woocommerce_id);

-- login_attempts
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts USING btree (ip_address, attempt_time DESC);
CREATE INDEX idx_login_attempts_time ON public.login_attempts USING btree (attempt_time);

-- order_items
CREATE INDEX idx_order_items_catalog_number ON public.order_items USING btree (catalog_number);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);

-- orders
CREATE INDEX idx_orders_code ON public.orders USING btree (code);
CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX idx_orders_customer_name ON public.orders USING gin (customer_name gin_trgm_ops);
CREATE INDEX idx_orders_phone ON public.orders USING btree (phone);
CREATE INDEX idx_orders_source ON public.orders USING btree (source);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_store_id ON public.orders USING btree (store_id);

-- price_history
CREATE INDEX idx_price_history_changed_at ON public.price_history USING btree (changed_at DESC);
CREATE INDEX idx_price_history_product_id ON public.price_history USING btree (product_id);

-- stock_movements
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements USING btree (created_at DESC);
CREATE INDEX idx_stock_movements_document_id ON public.stock_movements USING btree (document_id);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements USING btree (product_id);
CREATE INDEX idx_stock_movements_warehouse_id ON public.stock_movements USING btree (warehouse_id);

-- stock_by_warehouse
CREATE INDEX idx_stock_by_warehouse_product ON public.stock_by_warehouse USING btree (product_id);
CREATE INDEX idx_stock_by_warehouse_warehouse ON public.stock_by_warehouse USING btree (warehouse_id);

-- ============================================================
-- 6. FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_users
    WHERE email = _email AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_allowed_user(_email text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_users WHERE email = _email
  )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_email text, _module text, _action text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.allowed_users au
    JOIN public.role_permissions rp ON au.role = rp.role
    WHERE au.email = _email
      AND rp.module = _module
      AND CASE
        WHEN _action = 'view' THEN rp.can_view
        WHEN _action = 'create' THEN rp.can_create
        WHEN _action = 'edit' THEN rp.can_edit
        WHEN _action = 'delete' THEN rp.can_delete
        ELSE false
      END
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_document_number(doc_type document_type)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM public.login_attempts WHERE attempt_time < now() - INTERVAL '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'in' OR NEW.movement_type = 'return' THEN
            UPDATE public.inventory_products 
            SET current_stock = current_stock + NEW.quantity, updated_at = now()
            WHERE id = NEW.product_id;
        ELSIF NEW.movement_type = 'out' THEN
            UPDATE public.inventory_products 
            SET current_stock = current_stock - NEW.quantity, updated_at = now()
            WHERE id = NEW.product_id;
        ELSIF NEW.movement_type = 'adjustment' THEN
            UPDATE public.inventory_products 
            SET current_stock = NEW.stock_after, updated_at = now()
            WHERE id = NEW.product_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF OLD.purchase_price IS DISTINCT FROM NEW.purchase_price THEN
    INSERT INTO public.price_history (product_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'purchase_price', OLD.purchase_price, NEW.purchase_price, auth.uid());
  END IF;
  IF OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
    INSERT INTO public.price_history (product_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'sale_price', OLD.sale_price, NEW.sale_price, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_bundle_components()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
    bundle_record RECORD;
    current_product RECORD;
BEGIN
    IF NEW.movement_type = 'out' THEN
        SELECT is_bundle INTO current_product FROM inventory_products WHERE id = NEW.product_id;
        IF current_product.is_bundle THEN
            FOR bundle_record IN 
                SELECT pb.component_product_id, pb.component_quantity, ip.current_stock
                FROM product_bundles pb
                JOIN inventory_products ip ON ip.id = pb.component_product_id
                WHERE pb.parent_product_id = NEW.product_id
            LOOP
                INSERT INTO stock_movements (
                    product_id, movement_type, quantity, reason,
                    stock_before, stock_after, document_id, created_by
                ) VALUES (
                    bundle_record.component_product_id, 'out',
                    bundle_record.component_quantity * NEW.quantity,
                    'Автоматично изписване от комплект: ' || (SELECT name FROM inventory_products WHERE id = NEW.product_id),
                    bundle_record.current_stock,
                    bundle_record.current_stock - (bundle_record.component_quantity * NEW.quantity),
                    NEW.document_id, NEW.created_by
                );
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_customer_from_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  customer_record RECORD;
BEGIN
  SELECT * INTO customer_record FROM public.customers WHERE phone = NEW.phone LIMIT 1;
  IF customer_record IS NULL THEN
    INSERT INTO public.customers (name, phone, email, total_orders, total_spent, first_order_date, last_order_date)
    VALUES (NEW.customer_name, NEW.phone, NEW.customer_email, 1, NEW.total_price, NEW.created_at, NEW.created_at);
  ELSE
    UPDATE public.customers SET
      name = COALESCE(NEW.customer_name, customer_record.name),
      email = COALESCE(NEW.customer_email, customer_record.email),
      total_orders = customer_record.total_orders + 1,
      total_spent = customer_record.total_spent + NEW.total_price,
      last_order_date = NEW.created_at,
      updated_at = now()
    WHERE id = customer_record.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

-- Note: If triggers were not returned from information_schema,
-- you need to recreate them manually:

CREATE TRIGGER update_product_stock_trigger
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

CREATE TRIGGER deduct_bundle_components_trigger
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.deduct_bundle_components();

CREATE TRIGGER log_price_change_trigger
  BEFORE UPDATE ON public.inventory_products
  FOR EACH ROW EXECUTE FUNCTION public.log_price_change();

CREATE TRIGGER sync_customer_from_order_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_from_order();

-- updated_at triggers (apply to all tables with updated_at column)
CREATE TRIGGER update_api_settings_updated_at BEFORE UPDATE ON public.api_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courier_api_settings_updated_at BEFORE UPDATE ON public.courier_api_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ecommerce_platforms_updated_at BEFORE UPDATE ON public.ecommerce_platforms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_categories_updated_at BEFORE UPDATE ON public.inventory_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_products_updated_at BEFORE UPDATE ON public.inventory_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_statuses_updated_at BEFORE UPDATE ON public.order_statuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_bundles_updated_at BEFORE UPDATE ON public.product_bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_role_permissions_updated_at BEFORE UPDATE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_batches_updated_at BEFORE UPDATE ON public.stock_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_by_warehouse_updated_at BEFORE UPDATE ON public.stock_by_warehouse FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stock_documents_updated_at BEFORE UPDATE ON public.stock_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connectix_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_by_warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8.1 RLS POLICIES
-- ============================================================

-- allowed_users
CREATE POLICY "Admins can view all allowed_users" ON public.allowed_users FOR SELECT TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users can view own allowed_users row" ON public.allowed_users FOR SELECT TO authenticated USING (email = (auth.jwt() ->> 'email'::text));
CREATE POLICY "Admins can insert allowed_users" ON public.allowed_users FOR INSERT TO authenticated WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can update allowed_users" ON public.allowed_users FOR UPDATE TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can delete allowed_users" ON public.allowed_users FOR DELETE TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)) AND email <> (auth.jwt() ->> 'email'::text));

-- api_settings
CREATE POLICY "Admins can manage settings" ON public.api_settings FOR ALL USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can view settings" ON public.api_settings FOR SELECT USING (is_admin((auth.jwt() ->> 'email'::text)));

-- audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can delete audit logs" ON public.audit_logs FOR DELETE USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- company_settings
CREATE POLICY "Admins can view company settings" ON public.company_settings FOR SELECT TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can insert company settings" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can update company settings" ON public.company_settings FOR UPDATE TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));

-- connectix_messages
CREATE POLICY "Allowed users can view messages" ON public.connectix_messages FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can insert messages" ON public.connectix_messages FOR INSERT WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Service role has full access" ON public.connectix_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- couriers
CREATE POLICY "Authenticated users can view couriers" ON public.couriers FOR SELECT USING (true);
CREATE POLICY "Admins can insert couriers" ON public.couriers FOR INSERT WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can update couriers" ON public.couriers FOR UPDATE USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can delete couriers" ON public.couriers FOR DELETE USING (is_admin((auth.jwt() ->> 'email'::text)));

-- courier_api_settings
CREATE POLICY "Admins can view courier API settings" ON public.courier_api_settings FOR SELECT TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can insert courier API settings" ON public.courier_api_settings FOR INSERT TO authenticated WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can update courier API settings" ON public.courier_api_settings FOR UPDATE TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can delete courier API settings" ON public.courier_api_settings FOR DELETE TO authenticated USING (is_admin((auth.jwt() ->> 'email'::text)));

-- credit_notes
CREATE POLICY "Authenticated users can view credit notes" ON public.credit_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage credit notes" ON public.credit_notes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- customers
CREATE POLICY "Allowed users can view customers" ON public.customers FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can insert customers" ON public.customers FOR INSERT WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can update customers" ON public.customers FOR UPDATE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can delete customers" ON public.customers FOR DELETE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- customer_notes
CREATE POLICY "Allowed users can view customer notes" ON public.customer_notes FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can insert customer notes" ON public.customer_notes FOR INSERT WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can update customer notes" ON public.customer_notes FOR UPDATE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can delete customer notes" ON public.customer_notes FOR DELETE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- ecommerce_platforms
CREATE POLICY "Authenticated users can view platforms" ON public.ecommerce_platforms FOR SELECT USING (true);
CREATE POLICY "Admins can insert platforms" ON public.ecommerce_platforms FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM allowed_users WHERE email = (auth.jwt() ->> 'email') AND role = 'admin'));
CREATE POLICY "Admins can update platforms" ON public.ecommerce_platforms FOR UPDATE USING (EXISTS (SELECT 1 FROM allowed_users WHERE email = (auth.jwt() ->> 'email') AND role = 'admin'));
CREATE POLICY "Admins can delete platforms" ON public.ecommerce_platforms FOR DELETE USING (EXISTS (SELECT 1 FROM allowed_users WHERE email = (auth.jwt() ->> 'email') AND role = 'admin'));

-- expenses
CREATE POLICY "Authenticated users can view expenses" ON public.expenses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users with create permission can insert expenses" ON public.expenses FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'create'));
CREATE POLICY "Users with edit permission can update expenses" ON public.expenses FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'edit'));
CREATE POLICY "Users with delete permission can delete expenses" ON public.expenses FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'invoices', 'delete'));

-- inventory_categories
CREATE POLICY "Authenticated users can view categories" ON public.inventory_categories FOR SELECT USING (true);
CREATE POLICY "Users with create permission can insert categories" ON public.inventory_categories FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update categories" ON public.inventory_categories FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete categories" ON public.inventory_categories FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- inventory_products
CREATE POLICY "Authenticated users can view products" ON public.inventory_products FOR SELECT USING (true);
CREATE POLICY "Users with create permission can insert products" ON public.inventory_products FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update products" ON public.inventory_products FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete products" ON public.inventory_products FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- invoices
CREATE POLICY "Allowed users can view invoices" ON public.invoices FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can insert invoices" ON public.invoices FOR INSERT WITH CHECK (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can update invoices" ON public.invoices FOR UPDATE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Allowed users can delete invoices" ON public.invoices FOR DELETE USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- login_attempts
CREATE POLICY "Service role manages login attempts" ON public.login_attempts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- order_items
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Users with create permission can insert order items" ON public.order_items FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'create'));
CREATE POLICY "Users with edit permission can update order items" ON public.order_items FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'edit'));
CREATE POLICY "Users with delete permission can delete order items" ON public.order_items FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'delete'));

-- order_statuses
CREATE POLICY "Anyone can view order statuses" ON public.order_statuses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage statuses" ON public.order_statuses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- orders
CREATE POLICY "Allowed users can view orders" ON public.orders FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert orders" ON public.orders FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'create'));
CREATE POLICY "Users with edit permission can update orders" ON public.orders FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'edit'));
CREATE POLICY "Users with delete permission can delete orders" ON public.orders FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'delete'));

-- price_history
CREATE POLICY "Price history is viewable by authenticated users" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Price history can be inserted by authenticated users" ON public.price_history FOR INSERT WITH CHECK (true);

-- product_bundles
CREATE POLICY "Allowed users can view bundles" ON public.product_bundles FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert bundles" ON public.product_bundles FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update bundles" ON public.product_bundles FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete bundles" ON public.product_bundles FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- role_permissions
CREATE POLICY "Authenticated users can view role permissions" ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

-- shipments
CREATE POLICY "Allowed users can view shipments" ON public.shipments FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert shipments" ON public.shipments FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'create'));
CREATE POLICY "Users with edit permission can update shipments" ON public.shipments FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'edit'));
CREATE POLICY "Users with delete permission can delete shipments" ON public.shipments FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'shipments', 'delete'));

-- stock_batches
CREATE POLICY "Allowed users can view batches" ON public.stock_batches FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert batches" ON public.stock_batches FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update batches" ON public.stock_batches FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete batches" ON public.stock_batches FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- stock_by_warehouse
CREATE POLICY "Allowed users can view stock_by_warehouse" ON public.stock_by_warehouse FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert stock_by_warehouse" ON public.stock_by_warehouse FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update stock_by_warehouse" ON public.stock_by_warehouse FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete stock_by_warehouse" ON public.stock_by_warehouse FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- stock_documents
CREATE POLICY "Authenticated users can view documents" ON public.stock_documents FOR SELECT USING (true);
CREATE POLICY "Users with create permission can insert documents" ON public.stock_documents FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update documents" ON public.stock_documents FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete documents" ON public.stock_documents FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- stock_movements
CREATE POLICY "Allowed users can view movements" ON public.stock_movements FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert movements" ON public.stock_movements FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update movements" ON public.stock_movements FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete movements" ON public.stock_movements FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- stores
CREATE POLICY "Allowed users can view stores" ON public.stores FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

-- suppliers
CREATE POLICY "Allowed users can view suppliers" ON public.suppliers FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with create permission can insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'create'));
CREATE POLICY "Users with edit permission can update suppliers" ON public.suppliers FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'edit'));
CREATE POLICY "Users with delete permission can delete suppliers" ON public.suppliers FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory', 'delete'));

-- units_of_measure
CREATE POLICY "Authenticated users can view units" ON public.units_of_measure FOR SELECT USING (true);
CREATE POLICY "Admins can manage units" ON public.units_of_measure FOR ALL USING (is_admin((auth.jwt() ->> 'email'::text))) WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

-- warehouses
CREATE POLICY "Allowed users can view warehouses" ON public.warehouses FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can insert warehouses" ON public.warehouses FOR INSERT WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can update warehouses" ON public.warehouses FOR UPDATE USING (is_admin((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Admins can delete warehouses" ON public.warehouses FOR DELETE USING (is_admin((auth.jwt() ->> 'email'::text)));

-- ============================================================
-- 9. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('login-backgrounds', 'login-backgrounds', true) ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. REALTIME (if needed)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================
-- END OF SCHEMA EXPORT
-- ============================================================
