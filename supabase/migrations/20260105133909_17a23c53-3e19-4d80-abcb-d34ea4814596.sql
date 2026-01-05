-- Create orders table
CREATE TABLE public.orders (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT true,
  phone TEXT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  product_name TEXT NOT NULL,
  catalog_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  delivery_address TEXT,
  courier_tracking_url TEXT,
  status TEXT NOT NULL DEFAULT 'Нова',
  comment TEXT,
  source TEXT DEFAULT 'woocommerce',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create api_settings table
CREATE TABLE public.api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders - authenticated users can read all orders
CREATE POLICY "Authenticated users can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (true);

-- RLS policies for api_settings
CREATE POLICY "Authenticated users can view settings"
ON public.api_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage settings"
ON public.api_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert default API settings
INSERT INTO public.api_settings (setting_key, setting_value) VALUES
  ('woocommerce_url', ''),
  ('woocommerce_consumer_key', ''),
  ('woocommerce_consumer_secret', ''),
  ('webhook_url', ''),
  ('custom_api_key_1', ''),
  ('custom_api_key_2', '');

-- Insert test orders
INSERT INTO public.orders (code, customer_name, is_correct, phone, total_price, product_name, catalog_number, quantity, delivery_address, courier_tracking_url, status, comment, source) VALUES
  ('WC-10234', 'Иван Петров', true, '+359 888 123 456', 89.99, 'Спирачни накладки предни', 'BP-2341-FR', 2, 'София, ул. Витоша 45', 'https://www.econt.com/services/track-shipment.html?shipmentNumber=123456789', 'Изпратена', 'Клиентът иска доставка сутрин', 'google'),
  ('WC-10235', 'Мария Георгиева', true, '+359 899 456 789', 156.50, 'Масло двигателно 5W-40', 'OIL-5W40-5L', 1, 'Пловдив, бул. Марица 12', NULL, 'Нова', NULL, 'facebook'),
  ('WC-10236', 'Петър Димитров', false, '+359 877 789 012', 234.00, 'Комплект ремък ГРМ', 'TBK-VW-2019', 1, 'Варна, ж.к. Младост бл. 15', 'https://www.econt.com/services/track-shipment.html?shipmentNumber=987654321', 'Доставена', 'Внимание - клиентът е върнал предишна поръчка', 'woocommerce');