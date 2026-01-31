export type OrderStatus = 
  | 'Нова' 
  | 'В обработка' 
  | 'Неуспешна връзка' 
  | 'Потвърдена' 
  | 'Платена с карта' 
  | 'На лизинг през TBI' 
  | 'На лизинг през BNP'
  | 'На лизинг през UniCredit'
  | 'Изпратена' 
  | 'Неуспешна доставка' 
  | 'Доставена' 
  | 'Завършена' 
  | 'Върната' 
  | 'Отказана' 
  | 'Анулирана';

// Call status for phone communication tracking
export type CallStatus = 'none' | 'no_answer' | 'busy' | 'wrong_number' | 'callback' | 'called' | 'confirmed';

// E-commerce platforms that can be sources
export type EcommercePlatformSource = 'woocommerce' | 'prestashop' | 'opencart' | 'magento' | 'shopify';

// All possible order sources
export type OrderSource = 'google' | 'facebook' | 'phone' | EcommercePlatformSource | null;

export interface Order {
  id: number;
  code: string;
  created_at: string;
  customer_name: string;
  customer_email: string | null;
  is_correct: boolean;
  phone: string;
  total_price: number;
  product_name: string;
  catalog_number: string | null;
  quantity: number;
  delivery_address: string | null;
  courier_tracking_url: string | null;
  courier_id: string | null;
  status: OrderStatus;
  call_status?: CallStatus;
  comment: string | null;
  source: OrderSource;
  user_id: string | null;
  stock_deducted?: boolean;
}

export interface ApiSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
}

export const ORDER_STATUSES: OrderStatus[] = [
  'Нова',
  'В обработка',
  'Неуспешна връзка',
  'Потвърдена',
  'Платена с карта',
  'На лизинг през TBI',
  'На лизинг през BNP',
  'На лизинг през UniCredit',
  'Изпратена',
  'Неуспешна доставка',
  'Доставена',
  'Завършена',
  'Върната',
  'Отказана',
  'Анулирана',
];
