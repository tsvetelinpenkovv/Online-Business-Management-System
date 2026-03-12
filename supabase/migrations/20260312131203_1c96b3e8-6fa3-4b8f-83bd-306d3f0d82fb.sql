-- BUG-001: Add 'transfer' to movement_type enum
ALTER TYPE movement_type ADD VALUE IF NOT EXISTS 'transfer';

-- BUG-006: Create audit log trigger for inventory operations
CREATE OR REPLACE FUNCTION public.log_inventory_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _user_id uuid;
  _action text;
BEGIN
  _email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
  _user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, new_data)
    VALUES (_user_id, _email, _action, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_data, new_data)
    VALUES (_user_id, _email, _action, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    INSERT INTO audit_logs (user_id, user_email, action, table_name, record_id, old_data)
    VALUES (_user_id, _email, _action, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Audit triggers for inventory tables
CREATE TRIGGER audit_inventory_products
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_products
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_audit();

CREATE TRIGGER audit_stock_movements
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_audit();

CREATE TRIGGER audit_stock_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_documents
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_audit();