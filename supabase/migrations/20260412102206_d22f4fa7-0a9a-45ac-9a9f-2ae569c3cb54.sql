CREATE OR REPLACE FUNCTION public.check_duplicate_order(_phone text, _product_name text, _hours integer DEFAULT 24)
 RETURNS TABLE(duplicate_id bigint, duplicate_code text, duplicate_date timestamp with time zone, similarity_score real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $$
  SELECT 
    o.id,
    o.code,
    o.created_at,
    extensions.similarity(o.product_name, _product_name) AS similarity_score
  FROM orders o
  WHERE o.phone = _phone
    AND o.created_at > now() - make_interval(hours => _hours)
    AND extensions.similarity(o.product_name, _product_name) > 0.3
  ORDER BY o.created_at DESC
  LIMIT 5;
$$;