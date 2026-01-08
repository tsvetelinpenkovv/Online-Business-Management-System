import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  InventoryProduct, 
  InventoryCategory, 
  UnitOfMeasure, 
  Supplier, 
  StockDocument, 
  StockMovement,
  StockBatch,
  DocumentType,
  MovementType
} from '@/types/inventory';
import { useToast } from '@/hooks/use-toast';

export function useInventory() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<StockDocument[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory_products')
      .select(`
        *,
        category:inventory_categories(*),
        unit:units_of_measure(*)
      `)
      .order('name');
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на продукти', variant: 'destructive' });
      return;
    }
    setProducts(data as unknown as InventoryProduct[]);
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на категории', variant: 'destructive' });
      return;
    }
    setCategories(data);
  }, [toast]);

  const fetchUnits = useCallback(async () => {
    const { data, error } = await supabase
      .from('units_of_measure')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на мерни единици', variant: 'destructive' });
      return;
    }
    setUnits(data);
  }, [toast]);

  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на доставчици', variant: 'destructive' });
      return;
    }
    setSuppliers(data);
  }, [toast]);

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from('stock_documents')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на документи', variant: 'destructive' });
      return;
    }
    setDocuments(data as unknown as StockDocument[]);
  }, [toast]);

  const fetchMovements = useCallback(async (limit = 100) => {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:inventory_products(*),
        batch:stock_batches(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на движения', variant: 'destructive' });
      return;
    }
    setMovements(data as unknown as StockMovement[]);
  }, [toast]);

  const fetchBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('stock_batches')
      .select(`
        *,
        product:inventory_products(*),
        supplier:suppliers(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на партиди', variant: 'destructive' });
      return;
    }
    setBatches(data as unknown as StockBatch[]);
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchUnits(),
      fetchSuppliers(),
      fetchDocuments(),
      fetchMovements(),
      fetchBatches(),
    ]);
    setLoading(false);
  }, [fetchProducts, fetchCategories, fetchUnits, fetchSuppliers, fetchDocuments, fetchMovements, fetchBatches]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Product CRUD
  const createProduct = async (product: Omit<InventoryProduct, 'id' | 'created_at' | 'updated_at' | 'current_stock' | 'category' | 'unit'>) => {
    const { data, error } = await supabase
      .from('inventory_products')
      .insert(product)
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на продукт', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Успех', description: 'Продуктът е създаден' });
    await fetchProducts();
    return data;
  };

  const updateProduct = async (id: string, updates: Partial<InventoryProduct>) => {
    const { error } = await supabase
      .from('inventory_products')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна актуализация на продукт', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Продуктът е актуализиран' });
    await fetchProducts();
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('inventory_products')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на продукт', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Продуктът е изтрит' });
    await fetchProducts();
    return true;
  };

  // Supplier CRUD
  const createSupplier = async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на доставчик', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Успех', description: 'Доставчикът е създаден' });
    await fetchSuppliers();
    return data;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const { error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна актуализация на доставчик', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Доставчикът е актуализиран' });
    await fetchSuppliers();
    return true;
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на доставчик', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Доставчикът е изтрит' });
    await fetchSuppliers();
    return true;
  };

  // Category CRUD
  const createCategory = async (category: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('inventory_categories')
      .insert(category)
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на категория', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Успех', description: 'Категорията е създадена' });
    await fetchCategories();
    return data;
  };

  const updateCategory = async (id: string, updates: Partial<InventoryCategory>) => {
    const { error } = await supabase
      .from('inventory_categories')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна актуализация на категория', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Категорията е актуализирана' });
    await fetchCategories();
    return true;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('inventory_categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на категория', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Успех', description: 'Категорията е изтрита' });
    await fetchCategories();
    return true;
  };

  // Stock movements
  const createStockMovement = async (
    productId: string,
    movementType: MovementType,
    quantity: number,
    unitPrice: number = 0,
    reason?: string,
    batchId?: string,
    documentId?: string
  ) => {
    // Get current stock
    const product = products.find(p => p.id === productId);
    if (!product) {
      toast({ title: 'Грешка', description: 'Продуктът не е намерен', variant: 'destructive' });
      return null;
    }

    const stockBefore = product.current_stock;
    let stockAfter = stockBefore;

    if (movementType === 'in' || movementType === 'return') {
      stockAfter = stockBefore + quantity;
    } else if (movementType === 'out') {
      stockAfter = stockBefore - quantity;
    } else if (movementType === 'adjustment') {
      stockAfter = quantity; // For adjustment, quantity IS the new stock level
    }

    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        movement_type: movementType,
        quantity: movementType === 'adjustment' ? Math.abs(quantity - stockBefore) : quantity,
        unit_price: unitPrice,
        total_price: quantity * unitPrice,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason,
        batch_id: batchId,
        document_id: documentId,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на движение', variant: 'destructive' });
      return null;
    }

    toast({ title: 'Успех', description: 'Движението е записано' });
    await Promise.all([fetchProducts(), fetchMovements()]);
    return data;
  };

  // Create stock document with movements
  const createStockDocument = async (
    documentType: DocumentType,
    items: Array<{ productId: string; quantity: number; unitPrice: number; batchId?: string }>,
    supplierId?: string,
    counterpartyName?: string,
    notes?: string
  ) => {
    // Generate document number
    const { data: docNumData } = await supabase.rpc('generate_document_number', { doc_type: documentType });
    const documentNumber = docNumData || `DOC-${Date.now()}`;

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Create document
    const { data: doc, error: docError } = await supabase
      .from('stock_documents')
      .insert({
        document_number: documentNumber,
        document_type: documentType,
        supplier_id: supplierId,
        counterparty_name: counterpartyName,
        notes,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (docError) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на документ', variant: 'destructive' });
      return null;
    }

    // Determine movement type based on document type
    let movementType: MovementType = 'in';
    if (documentType === 'dispatch') movementType = 'out';
    else if (documentType === 'adjustment') movementType = 'adjustment';
    else if (documentType === 'return') movementType = 'return';

    // Create movements for each item
    for (const item of items) {
      await createStockMovement(
        item.productId,
        movementType,
        item.quantity,
        item.unitPrice,
        undefined,
        item.batchId,
        doc.id
      );
    }

    await fetchDocuments();
    toast({ title: 'Успех', description: `Документ ${documentNumber} е създаден` });
    return doc;
  };

  // Create batch
  const createBatch = async (
    productId: string,
    batchNumber: string,
    quantity: number,
    purchasePrice: number,
    supplierId?: string,
    expiryDate?: string,
    notes?: string
  ) => {
    const { data, error } = await supabase
      .from('stock_batches')
      .insert({
        product_id: productId,
        batch_number: batchNumber,
        supplier_id: supplierId,
        quantity,
        remaining_quantity: quantity,
        purchase_price: purchasePrice,
        expiry_date: expiryDate,
        notes,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно създаване на партида', variant: 'destructive' });
      return null;
    }

    toast({ title: 'Успех', description: 'Партидата е създадена' });
    await fetchBatches();
    return data;
  };

  // Statistics
  const getInventoryStats = useCallback(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.is_active).length;
    const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0).length;
    const outOfStockProducts = products.filter(p => p.current_stock <= 0).length;
    const totalStockValue = products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0);
    const totalSaleValue = products.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0);
    const potentialProfit = totalSaleValue - totalStockValue;

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      totalSaleValue,
      potentialProfit,
    };
  }, [products]);

  return {
    products,
    categories,
    units,
    suppliers,
    documents,
    movements,
    batches,
    loading,
    // Refresh functions
    refresh: fetchAll,
    refreshProducts: fetchProducts,
    refreshCategories: fetchCategories,
    refreshSuppliers: fetchSuppliers,
    refreshDocuments: fetchDocuments,
    refreshMovements: fetchMovements,
    refreshBatches: fetchBatches,
    // Product CRUD
    createProduct,
    updateProduct,
    deleteProduct,
    // Supplier CRUD
    createSupplier,
    updateSupplier,
    deleteSupplier,
    // Category CRUD
    createCategory,
    updateCategory,
    deleteCategory,
    // Stock operations
    createStockMovement,
    createStockDocument,
    createBatch,
    // Statistics
    getInventoryStats,
  };
}
