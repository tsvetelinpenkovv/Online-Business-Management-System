export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockByWarehouse {
  id: string;
  product_id: string;
  warehouse_id: string;
  current_stock: number;
  reserved_stock: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
  // Joined
  warehouse?: Warehouse;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Action types for audit log
export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'stock_movement'
  | 'login'
  | 'logout'
  | 'export';
