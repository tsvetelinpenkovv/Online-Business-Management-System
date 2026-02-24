
-- product_images: local cache of product images from external platforms
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  external_image_id text,
  original_url text NOT NULL,
  cached_url text,
  thumbnail_url text,
  alt text,
  position integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  file_size integer,
  content_hash text,
  last_fetched_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON public.product_images(product_id, position);
CREATE UNIQUE INDEX idx_product_images_external ON public.product_images(product_id, external_image_id) WHERE external_image_id IS NOT NULL;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view product images" ON public.product_images
  FOR SELECT USING (true);

CREATE POLICY "Users with inventory create can insert images" ON public.product_images
  FOR INSERT WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'create'::text));

CREATE POLICY "Users with inventory edit can update images" ON public.product_images
  FOR UPDATE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'edit'::text));

CREATE POLICY "Users with inventory delete can delete images" ON public.product_images
  FOR DELETE USING (has_permission((auth.jwt() ->> 'email'::text), 'inventory'::text, 'delete'::text));

-- Service role access for edge functions
CREATE POLICY "Service role full access product images" ON public.product_images
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_product_images_updated_at
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for cached product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Service role can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Service role can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');
