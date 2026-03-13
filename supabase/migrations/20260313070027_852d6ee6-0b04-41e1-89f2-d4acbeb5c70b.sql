
-- Media folders table
CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view media folders" ON public.media_folders FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with inventory create can insert media folders" ON public.media_folders FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));
CREATE POLICY "Users with inventory edit can update media folders" ON public.media_folders FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));
CREATE POLICY "Users with inventory delete can delete media folders" ON public.media_folders FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

CREATE TRIGGER update_media_folders_updated_at BEFORE UPDATE ON public.media_folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Media files table
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  width integer,
  height integer,
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.inventory_products(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'media',
  public_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view media files" ON public.media_files FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with inventory create can insert media files" ON public.media_files FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));
CREATE POLICY "Users with inventory edit can update media files" ON public.media_files FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));
CREATE POLICY "Users with inventory delete can delete media files" ON public.media_files FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

CREATE TRIGGER update_media_files_updated_at BEFORE UPDATE ON public.media_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_media_files_folder ON public.media_files(folder_id);
CREATE INDEX idx_media_files_product ON public.media_files(product_id);
CREATE INDEX idx_media_files_created ON public.media_files(created_at DESC);
CREATE INDEX idx_media_files_mime ON public.media_files(mime_type);

-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view promo codes" ON public.promo_codes FOR SELECT USING (is_allowed_user((auth.jwt() ->> 'email'::text)));
CREATE POLICY "Users with orders create can insert promo codes" ON public.promo_codes FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'create'::text));
CREATE POLICY "Users with orders edit can update promo codes" ON public.promo_codes FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'edit'::text));
CREATE POLICY "Users with orders delete can delete promo codes" ON public.promo_codes FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'orders'::text, 'delete'::text));

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;

-- Media storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage RLS for media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Anyone can view media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY "Authenticated users can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_documents_created_at ON public.stock_documents(created_at DESC);
