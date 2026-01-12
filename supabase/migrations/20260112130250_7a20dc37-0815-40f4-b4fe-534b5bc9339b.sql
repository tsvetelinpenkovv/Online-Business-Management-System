-- Add new order status "На лизинг през UniCredit"
INSERT INTO public.order_statuses (name, color, icon, sort_order, is_default)
VALUES ('На лизинг през UniCredit', 'teal', 'CreditCard', 8, true)
ON CONFLICT (name) DO NOTHING;