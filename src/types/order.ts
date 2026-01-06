export type OrderStatus = 
  | 'Нова' 
  | 'В обработка' 
  | 'Неуспешна връзка' 
  | 'Потвърдена' 
  | 'Платена с карта' 
  | 'На лизинг през TBI' 
  | 'На лизинг през BNP' 
  | 'Изпратена' 
  | 'Неуспешна доставка' 
  | 'Доставена' 
  | 'Завършена' 
  | 'Върната' 
  | 'Отказана' 
  | 'Анулирана';

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
  status: OrderStatus;
  comment: string | null;
  source: 'google' | 'facebook' | 'woocommerce';
  user_id: string | null;
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
  'Изпратена',
  'Неуспешна доставка',
  'Доставена',
  'Завършена',
  'Върната',
  'Отказана',
  'Анулирана',
];
