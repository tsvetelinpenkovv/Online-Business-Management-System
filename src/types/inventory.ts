export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  eik: string | null;
  vat_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_id: string | null;
  purchase_price: number;
  sale_price: number;
  min_stock_level: number;
  current_stock: number;
  woocommerce_id: number | null;
  barcode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: InventoryCategory;
  unit?: UnitOfMeasure;
}

export interface StockBatch {
  id: string;
  product_id: string;
  batch_number: string;
  supplier_id: string | null;
  quantity: number;
  remaining_quantity: number;
  purchase_price: number | null;
  expiry_date: string | null;
  received_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product?: InventoryProduct;
  supplier?: Supplier;
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'return';
export type DocumentType = 'receiving' | 'dispatch' | 'adjustment' | 'return' | 'inventory';

export interface StockDocument {
  id: string;
  document_number: string;
  document_type: DocumentType;
  document_date: string;
  supplier_id: string | null;
  counterparty_name: string | null;
  notes: string | null;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  supplier?: Supplier;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  document_id: string | null;
  product_id: string;
  batch_id: string | null;
  movement_type: MovementType;
  quantity: number;
  unit_price: number;
  total_price: number;
  stock_before: number;
  stock_after: number;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  product?: InventoryProduct;
  batch?: StockBatch;
  document?: StockDocument;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  receiving: 'Приемателен протокол',
  dispatch: 'Разходен протокол',
  adjustment: 'Корекция',
  return: 'Връщане',
  inventory: 'Инвентаризация',
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: 'Приход',
  out: 'Разход',
  adjustment: 'Корекция',
  return: 'Връщане',
};
