
-- ============================================================
-- 1. DATABASE VIEW: orders_full (orders + items + shipments)
-- ============================================================
CREATE OR REPLACE VIEW public.orders_full AS
SELECT 
  o.*,
  COALESCE(oi.items_json, '[]'::jsonb) AS items,
  COALESCE(oi.items_count, 0) AS items_count,
  COALESCE(sh.shipments_json, '[]'::jsonb) AS shipments,
  COALESCE(sh.shipments_count, 0) AS shipments_count,
  sh.latest_waybill,
  sh.latest_shipment_status
FROM orders o
LEFT JOIN LATERAL (
  SELECT 
    jsonb_agg(jsonb_build_object(
      'id', oi2.id,
      'product_name', oi2.product_name,
      'catalog_number', oi2.catalog_number,
      'quantity', oi2.quantity,
      'unit_price', oi2.unit_price,
      'total_price', oi2.total_price
    )) AS items_json,
    count(*)::int AS items_count
  FROM order_items oi2
  WHERE oi2.order_id = o.id
) oi ON true
LEFT JOIN LATERAL (
  SELECT 
    jsonb_agg(jsonb_build_object(
      'id', s2.id,
      'waybill_number', s2.waybill_number,
      'courier_id', s2.courier_id,
      'status', s2.status,
      'label_url', s2.label_url,
      'created_at', s2.created_at
    ) ORDER BY s2.created_at DESC) AS shipments_json,
    count(*)::int AS shipments_count,
    (array_agg(s2.waybill_number ORDER BY s2.created_at DESC))[1] AS latest_waybill,
    (array_agg(s2.status ORDER BY s2.created_at DESC))[1] AS latest_shipment_status
  FROM shipments s2
  WHERE s2.order_id = o.id
) sh ON true;

-- RLS for the view (views inherit from base tables, but we add explicit policy)
-- Views don't need RLS directly - they use the underlying table policies

-- ============================================================
-- 2. ORDER HISTORY / TIMELINE TABLE
-- ============================================================
CREATE TABLE public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_history_order_id ON public.order_history(order_id);
CREATE INDEX idx_order_history_created_at ON public.order_history(created_at DESC);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view order history"
  ON public.order_history FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Authenticated users can insert order history"
  ON public.order_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Trigger to auto-log order changes
CREATE OR REPLACE FUNCTION public.log_order_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  _email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
  
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_history (order_id, user_id, user_email, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), _email, 'status_change', 'status', OLD.status, NEW.status);
  END IF;
  
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_history (order_id, user_id, user_email, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), _email, 'payment_change', 'payment_status', OLD.payment_status, NEW.payment_status);
  END IF;
  
  IF OLD.courier_id IS DISTINCT FROM NEW.courier_id THEN
    INSERT INTO order_history (order_id, user_id, user_email, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), _email, 'courier_change', 'courier_id', OLD.courier_id::text, NEW.courier_id::text);
  END IF;
  
  IF OLD.delivery_address IS DISTINCT FROM NEW.delivery_address THEN
    INSERT INTO order_history (order_id, user_id, user_email, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), _email, 'address_change', 'delivery_address', OLD.delivery_address, NEW.delivery_address);
  END IF;
  
  IF OLD.comment IS DISTINCT FROM NEW.comment THEN
    INSERT INTO order_history (order_id, user_id, user_email, action, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), _email, 'comment_change', 'comment', OLD.comment, NEW.comment);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_changes
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_changes();

-- ============================================================
-- 3. ORDER TEMPLATES TABLE
-- ============================================================
CREATE TABLE public.order_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  usage_count integer DEFAULT 0
);

ALTER TABLE public.order_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view templates"
  ON public.order_templates FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Users with create permission can insert templates"
  ON public.order_templates FOR INSERT
  WITH CHECK (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'create'));

CREATE POLICY "Users with edit permission can update templates"
  ON public.order_templates FOR UPDATE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'edit'));

CREATE POLICY "Users with delete permission can delete templates"
  ON public.order_templates FOR DELETE
  USING (has_permission((auth.jwt() ->> 'email'::text), 'orders', 'delete'));

-- ============================================================
-- 4. AUTOMATION RULES TABLE (workflow engine + auto status)
-- ============================================================
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL, -- 'status_change', 'new_order', 'shipment_delivered', 'low_stock', 'scheduled'
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  action_type text NOT NULL, -- 'change_status', 'send_notification', 'assign_user', 'webhook', 'email'
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation rules"
  ON public.automation_rules FOR ALL
  USING (is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Allowed users can view automation rules"
  ON public.automation_rules FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- ============================================================
-- 5. SCHEDULED ACTIONS TABLE
-- ============================================================
CREATE TABLE public.scheduled_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for timestamptz NOT NULL,
  executed_at timestamptz,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'executed', 'cancelled', 'failed'
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_actions_pending ON public.scheduled_actions(scheduled_for) WHERE status = 'pending';

ALTER TABLE public.scheduled_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scheduled actions"
  ON public.scheduled_actions FOR ALL
  USING (is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Allowed users can view scheduled actions"
  ON public.scheduled_actions FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

-- ============================================================
-- 6. OUTGOING WEBHOOKS TABLE
-- ============================================================
CREATE TABLE public.outgoing_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}', -- 'order.created', 'order.status_changed', 'stock.low', etc.
  headers jsonb DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT true,
  secret_key text,
  last_triggered_at timestamptz,
  failure_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.outgoing_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage outgoing webhooks"
  ON public.outgoing_webhooks FOR ALL
  USING (is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

-- Webhook delivery log
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.outgoing_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id, delivered_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook deliveries"
  ON public.webhook_deliveries FOR ALL
  USING (is_admin((auth.jwt() ->> 'email'::text)))
  WITH CHECK (is_admin((auth.jwt() ->> 'email'::text)));

-- ============================================================
-- 7. LOW STOCK ALERTS TABLE
-- ============================================================
CREATE TABLE public.stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.inventory_products(id) ON DELETE CASCADE,
  alert_type text NOT NULL DEFAULT 'low_stock', -- 'low_stock', 'out_of_stock', 'overstock'
  current_stock numeric NOT NULL,
  threshold numeric NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_alerts_unread ON public.stock_alerts(is_read, created_at DESC) WHERE is_read = false;
CREATE UNIQUE INDEX idx_stock_alerts_active ON public.stock_alerts(product_id, alert_type) WHERE resolved_at IS NULL;

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view stock alerts"
  ON public.stock_alerts FOR SELECT
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "System can manage stock alerts"
  ON public.stock_alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to auto-create low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if stock fell below minimum
  IF NEW.current_stock <= COALESCE(NEW.min_stock_level, 0) AND NEW.min_stock_level IS NOT NULL AND NEW.min_stock_level > 0 THEN
    INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold)
    VALUES (
      NEW.id,
      CASE WHEN NEW.current_stock <= 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      NEW.current_stock,
      NEW.min_stock_level
    )
    ON CONFLICT (product_id, alert_type) WHERE resolved_at IS NULL
    DO UPDATE SET current_stock = EXCLUDED.current_stock, created_at = now();
  ELSE
    -- Resolve existing alerts if stock is above threshold
    UPDATE stock_alerts 
    SET resolved_at = now() 
    WHERE product_id = NEW.id 
      AND resolved_at IS NULL
      AND alert_type IN ('low_stock', 'out_of_stock');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_low_stock
  AFTER UPDATE OF current_stock ON public.inventory_products
  FOR EACH ROW
  EXECUTE FUNCTION public.check_low_stock();

-- ============================================================
-- 8. DUPLICATE DETECTION FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_duplicate_order(
  _phone text,
  _product_name text,
  _hours integer DEFAULT 24
)
RETURNS TABLE(
  duplicate_id bigint,
  duplicate_code text,
  duplicate_date timestamptz,
  similarity_score real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.code,
    o.created_at,
    similarity(o.product_name, _product_name) AS similarity_score
  FROM orders o
  WHERE o.phone = _phone
    AND o.created_at > now() - make_interval(hours => _hours)
    AND similarity(o.product_name, _product_name) > 0.3
  ORDER BY o.created_at DESC
  LIMIT 5;
$$;

-- ============================================================
-- 9. ORDER ASSIGNMENT TABLE
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_at timestamptz;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_alerts;
