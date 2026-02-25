
-- Fix 1: Change view to SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public.orders_full;
CREATE VIEW public.orders_full
WITH (security_invoker = true)
AS
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

-- Fix 2: Tighten stock_alerts policies (remove overly permissive ALL)
DROP POLICY IF EXISTS "System can manage stock alerts" ON public.stock_alerts;

CREATE POLICY "Service role can insert stock alerts"
  ON public.stock_alerts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role can update stock alerts"
  ON public.stock_alerts FOR UPDATE
  USING (is_allowed_user((auth.jwt() ->> 'email'::text)));

CREATE POLICY "Admins can delete stock alerts"
  ON public.stock_alerts FOR DELETE
  USING (is_admin((auth.jwt() ->> 'email'::text)));
