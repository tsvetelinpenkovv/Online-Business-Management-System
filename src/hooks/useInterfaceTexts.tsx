import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

// Define available icons
const AVAILABLE_ICONS = {
  Package: LucideIcons.Package,
  Warehouse: LucideIcons.Warehouse,
  Search: LucideIcons.Search,
  Type: LucideIcons.Type,
  Layout: LucideIcons.Layout,
  MessageCircle: LucideIcons.MessageCircle,
  ShieldAlert: LucideIcons.ShieldAlert,
  Settings: LucideIcons.Settings,
  LogOut: LucideIcons.LogOut,
  Plus: LucideIcons.Plus,
  Trash2: LucideIcons.Trash2,
  Printer: LucideIcons.Printer,
  Download: LucideIcons.Download,
  RefreshCw: LucideIcons.RefreshCw,
  Filter: LucideIcons.Filter,
  Calendar: LucideIcons.Calendar,
  Globe: LucideIcons.Globe,
  BarChart3: LucideIcons.BarChart3,
  X: LucideIcons.X,
  FileText: LucideIcons.FileText,
  Eye: LucideIcons.Eye,
  Edit: LucideIcons.Edit,
  Check: LucideIcons.Check,
  Clock: LucideIcons.Clock,
  Truck: LucideIcons.Truck,
  Box: LucideIcons.Box,
  Users: LucideIcons.Users,
  Boxes: LucideIcons.Boxes,
  FileBox: LucideIcons.FileBox,
  Receipt: LucideIcons.Receipt,
  Tags: LucideIcons.Tags,
  Phone: LucideIcons.Phone,
  Mail: LucideIcons.Mail,
  MapPin: LucideIcons.MapPin,
  Hash: LucideIcons.Hash,
  DollarSign: LucideIcons.DollarSign,
  ShoppingCart: LucideIcons.ShoppingCart,
  Archive: LucideIcons.Archive,
  Clipboard: LucideIcons.Clipboard,
  AlertTriangle: LucideIcons.AlertTriangle,
  TrendingUp: LucideIcons.TrendingUp,
  PieChart: LucideIcons.PieChart,
  Activity: LucideIcons.Activity,
  Layers: LucideIcons.Layers,
  FolderOpen: LucideIcons.FolderOpen,
  FileInput: LucideIcons.FileInput,
  FileOutput: LucideIcons.FileOutput,
  ArrowLeftRight: LucideIcons.ArrowLeftRight,
  ChevronDown: LucideIcons.ChevronDown,
};

type IconName = keyof typeof AVAILABLE_ICONS;

export interface TextConfig {
  // Orders page header
  orders_page_title: string;
  orders_header_subtitle: string;
  orders_loading_text: string;
  orders_no_orders_text: string;
  
  // Orders filters
  orders_search_placeholder: string;
  orders_status_filter_label: string;
  orders_source_filter_label: string;
  orders_date_from_label: string;
  orders_date_to_label: string;
  orders_clear_filters_label: string;
  orders_statistics_button: string;
  
  // Orders buttons
  orders_add_button_label: string;
  orders_export_csv_label: string;
  orders_export_xml_label: string;
  orders_refresh_label: string;
  orders_messages_button_label: string;
  orders_warehouse_button_label: string;
  orders_nekorekten_button_label: string;
  orders_settings_button_label: string;
  orders_logout_button_label: string;
  orders_print_receipts_label: string;
  orders_print_waybills_label: string;
  orders_print_invoices_label: string;
  orders_change_status_label: string;
  orders_delete_selected_label: string;
  
  // Orders table headers
  orders_table_id_header: string;
  orders_table_date_header: string;
  orders_table_customer_header: string;
  orders_table_product_header: string;
  orders_table_quantity_header: string;
  orders_table_price_header: string;
  orders_table_status_header: string;
  orders_table_courier_header: string;
  orders_table_actions_header: string;
  orders_table_source_header: string;
  orders_table_correct_header: string;
  orders_table_message_header: string;
  
  // Orders actions
  orders_edit_action: string;
  orders_delete_action: string;
  orders_print_action: string;
  orders_invoice_action: string;
  orders_tracking_action: string;
  
  // Add order dialog
  orders_add_dialog_title: string;
  orders_add_dialog_customer_name: string;
  orders_add_dialog_phone: string;
  orders_add_dialog_email: string;
  orders_add_dialog_product_name: string;
  orders_add_dialog_catalog_number: string;
  orders_add_dialog_quantity: string;
  orders_add_dialog_price: string;
  orders_add_dialog_address: string;
  orders_add_dialog_source: string;
  orders_add_dialog_comment: string;
  orders_add_dialog_add_product: string;
  orders_add_dialog_total_price: string;
  
  // Inventory page
  inventory_page_title: string;
  inventory_loading_text: string;
  inventory_dashboard_tab: string;
  inventory_products_tab: string;
  inventory_suppliers_tab: string;
  inventory_categories_tab: string;
  inventory_documents_tab: string;
  inventory_movements_tab: string;
  inventory_reports_tab: string;
  inventory_forecast_tab: string;
  
  // Inventory dashboard
  inventory_total_products_label: string;
  inventory_low_stock_label: string;
  inventory_out_of_stock_label: string;
  inventory_total_value_label: string;
  inventory_sale_value_label: string;
  inventory_potential_profit_label: string;
  inventory_suppliers_count_label: string;
  inventory_low_stock_alerts_title: string;
  inventory_recent_movements_title: string;
  
  // Inventory products
  inventory_add_product_button: string;
  inventory_search_products: string;
  inventory_product_name: string;
  inventory_product_sku: string;
  inventory_product_barcode: string;
  inventory_product_category: string;
  inventory_product_stock: string;
  inventory_product_min_stock: string;
  inventory_product_purchase_price: string;
  inventory_product_sale_price: string;
  
  // Inventory suppliers
  inventory_add_supplier_button: string;
  inventory_supplier_name: string;
  inventory_supplier_contact: string;
  inventory_supplier_phone: string;
  inventory_supplier_email: string;
  inventory_supplier_address: string;
  
  // Inventory documents
  inventory_add_document_button: string;
  inventory_document_number: string;
  inventory_document_type: string;
  inventory_document_date: string;
  inventory_document_supplier: string;
  inventory_document_total: string;
  
  // Common
  common_save_button: string;
  common_cancel_button: string;
  common_delete_button: string;
  common_edit_button: string;
  common_add_button: string;
  common_search_label: string;
  common_loading_text: string;
  common_no_data_text: string;
  common_confirm_delete_title: string;
  common_confirm_delete_description: string;
  common_success_message: string;
  common_error_message: string;
  common_page_label: string;
  common_of_label: string;
}

export interface IconConfig {
  orders_add_icon: IconName;
  orders_export_icon: IconName;
  orders_refresh_icon: IconName;
  orders_messages_icon: IconName;
  orders_warehouse_icon: IconName;
  orders_nekorekten_icon: IconName;
  orders_settings_icon: IconName;
  orders_logout_icon: IconName;
  orders_print_icon: IconName;
  orders_delete_icon: IconName;
  orders_edit_icon: IconName;
  orders_search_icon: IconName;
  orders_filter_icon: IconName;
  orders_calendar_icon: IconName;
  orders_statistics_icon: IconName;
  
  inventory_dashboard_icon: IconName;
  inventory_products_icon: IconName;
  inventory_suppliers_icon: IconName;
  inventory_categories_icon: IconName;
  inventory_documents_icon: IconName;
  inventory_movements_icon: IconName;
  inventory_reports_icon: IconName;
  inventory_forecast_icon: IconName;
  inventory_add_icon: IconName;
  inventory_scan_icon: IconName;
  inventory_import_icon: IconName;
  inventory_refresh_icon: IconName;
}

const defaultTexts: TextConfig = {
  orders_page_title: 'Управление на поръчки',
  orders_header_subtitle: 'поръчки',
  orders_loading_text: 'Зареждане на поръчки...',
  orders_no_orders_text: 'Няма намерени поръчки',
  orders_search_placeholder: 'Търси клиент, телефон, ID...',
  orders_status_filter_label: 'Статуси',
  orders_source_filter_label: 'Източници',
  orders_date_from_label: 'От дата',
  orders_date_to_label: 'До дата',
  orders_clear_filters_label: 'Изчисти',
  orders_statistics_button: 'Статистика',
  orders_add_button_label: 'Нова поръчка',
  orders_export_csv_label: 'Експорт в CSV',
  orders_export_xml_label: 'Експорт в XML',
  orders_refresh_label: 'Обнови',
  orders_messages_button_label: 'Съобщения',
  orders_warehouse_button_label: 'Склад',
  orders_nekorekten_button_label: 'Некоректен',
  orders_settings_button_label: 'Настройки',
  orders_logout_button_label: 'Изход',
  orders_print_receipts_label: 'Печат на поръчки',
  orders_print_waybills_label: 'Печат на товарителници',
  orders_print_invoices_label: 'Печат на фактури',
  orders_change_status_label: 'Смени статус',
  orders_delete_selected_label: 'Изтрий избраните',
  orders_table_id_header: 'ID',
  orders_table_date_header: 'Дата',
  orders_table_customer_header: 'Клиент',
  orders_table_product_header: 'Продукт',
  orders_table_quantity_header: 'Кол.',
  orders_table_price_header: 'Цена',
  orders_table_status_header: 'Статус',
  orders_table_courier_header: 'Куриер',
  orders_table_actions_header: 'Действия',
  orders_table_source_header: 'Източник',
  orders_table_correct_header: 'Коректност',
  orders_table_message_header: 'Съобщение',
  orders_edit_action: 'Редактирай',
  orders_delete_action: 'Изтрий',
  orders_print_action: 'Печат',
  orders_invoice_action: 'Фактура',
  orders_tracking_action: 'Проследяване',
  orders_add_dialog_title: 'Добавяне на нова поръчка',
  orders_add_dialog_customer_name: 'Име на клиент',
  orders_add_dialog_phone: 'Телефон',
  orders_add_dialog_email: 'Имейл',
  orders_add_dialog_product_name: 'Име на продукт',
  orders_add_dialog_catalog_number: 'Каталожен номер',
  orders_add_dialog_quantity: 'Количество',
  orders_add_dialog_price: 'Цена',
  orders_add_dialog_address: 'Адрес за доставка',
  orders_add_dialog_source: 'Източник',
  orders_add_dialog_comment: 'Коментар',
  orders_add_dialog_add_product: 'Добави продукт',
  orders_add_dialog_total_price: 'Обща цена',
  inventory_page_title: 'Складова програма',
  inventory_loading_text: 'Зареждане на склад...',
  inventory_dashboard_tab: 'Табло',
  inventory_products_tab: 'Продукти',
  inventory_suppliers_tab: 'Доставчици',
  inventory_categories_tab: 'Категории',
  inventory_documents_tab: 'Документи',
  inventory_movements_tab: 'Движения',
  inventory_reports_tab: 'Справки',
  inventory_forecast_tab: 'Прогнози',
  inventory_total_products_label: 'Общо продукти',
  inventory_low_stock_label: 'Нисък запас',
  inventory_out_of_stock_label: 'Без наличност',
  inventory_total_value_label: 'Стойност на склада',
  inventory_sale_value_label: 'Продажна стойност',
  inventory_potential_profit_label: 'Потенциална печалба',
  inventory_suppliers_count_label: 'Доставчици',
  inventory_low_stock_alerts_title: 'Предупреждения за нисък запас',
  inventory_recent_movements_title: 'Последни движения',
  inventory_add_product_button: 'Добави продукт',
  inventory_search_products: 'Търси продукти...',
  inventory_product_name: 'Име',
  inventory_product_sku: 'SKU',
  inventory_product_barcode: 'Баркод',
  inventory_product_category: 'Категория',
  inventory_product_stock: 'Наличност',
  inventory_product_min_stock: 'Мин. наличност',
  inventory_product_purchase_price: 'Покупна цена',
  inventory_product_sale_price: 'Продажна цена',
  inventory_add_supplier_button: 'Добави доставчик',
  inventory_supplier_name: 'Име на доставчик',
  inventory_supplier_contact: 'Лице за контакт',
  inventory_supplier_phone: 'Телефон',
  inventory_supplier_email: 'Имейл',
  inventory_supplier_address: 'Адрес',
  inventory_add_document_button: 'Нов документ',
  inventory_document_number: 'Номер',
  inventory_document_type: 'Тип',
  inventory_document_date: 'Дата',
  inventory_document_supplier: 'Доставчик',
  inventory_document_total: 'Сума',
  common_save_button: 'Запази',
  common_cancel_button: 'Отказ',
  common_delete_button: 'Изтрий',
  common_edit_button: 'Редактирай',
  common_add_button: 'Добави',
  common_search_label: 'Търсене',
  common_loading_text: 'Зареждане...',
  common_no_data_text: 'Няма данни',
  common_confirm_delete_title: 'Потвърждение за изтриване',
  common_confirm_delete_description: 'Сигурни ли сте, че искате да изтриете този елемент?',
  common_success_message: 'Успешно запазено',
  common_error_message: 'Възникна грешка',
  common_page_label: 'Страница',
  common_of_label: 'от',
};

const defaultIcons: IconConfig = {
  orders_add_icon: 'Plus',
  orders_export_icon: 'Download',
  orders_refresh_icon: 'RefreshCw',
  orders_messages_icon: 'MessageCircle',
  orders_warehouse_icon: 'Warehouse',
  orders_nekorekten_icon: 'ShieldAlert',
  orders_settings_icon: 'Settings',
  orders_logout_icon: 'LogOut',
  orders_print_icon: 'Printer',
  orders_delete_icon: 'Trash2',
  orders_edit_icon: 'Edit',
  orders_search_icon: 'Search',
  orders_filter_icon: 'Filter',
  orders_calendar_icon: 'Calendar',
  orders_statistics_icon: 'BarChart3',
  inventory_dashboard_icon: 'BarChart3',
  inventory_products_icon: 'Package',
  inventory_suppliers_icon: 'Users',
  inventory_categories_icon: 'Layers',
  inventory_documents_icon: 'FileText',
  inventory_movements_icon: 'ArrowLeftRight',
  inventory_reports_icon: 'PieChart',
  inventory_forecast_icon: 'TrendingUp',
  inventory_add_icon: 'Plus',
  inventory_scan_icon: 'Search',
  inventory_import_icon: 'FileInput',
  inventory_refresh_icon: 'RefreshCw',
};

const SETTING_KEY = 'interface_texts';
const ICONS_SETTING_KEY = 'interface_icons';

interface InterfaceTextsContextValue {
  texts: TextConfig;
  icons: IconConfig;
  loading: boolean;
  getIcon: (key: keyof IconConfig) => React.ComponentType<{ className?: string }>;
  getText: (key: keyof TextConfig) => string;
  refetch: () => Promise<void>;
}

const InterfaceTextsContext = createContext<InterfaceTextsContextValue | null>(null);

export const InterfaceTextsProvider = ({ children }: { children: ReactNode }) => {
  const [texts, setTexts] = useState<TextConfig>(defaultTexts);
  const [icons, setIcons] = useState<IconConfig>(defaultIcons);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const [textsResult, iconsResult] = await Promise.all([
        supabase.from('api_settings').select('setting_value').eq('setting_key', SETTING_KEY).maybeSingle(),
        supabase.from('api_settings').select('setting_value').eq('setting_key', ICONS_SETTING_KEY).maybeSingle(),
      ]);

      if (textsResult.data?.setting_value) {
        setTexts({ ...defaultTexts, ...JSON.parse(textsResult.data.setting_value) });
      }
      if (iconsResult.data?.setting_value) {
        setIcons({ ...defaultIcons, ...JSON.parse(iconsResult.data.setting_value) });
      }
    } catch (error) {
      console.error('Error loading interface settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getIcon = useCallback((key: keyof IconConfig): React.ComponentType<{ className?: string }> => {
    const iconName = icons[key];
    return AVAILABLE_ICONS[iconName] || AVAILABLE_ICONS.Package;
  }, [icons]);

  const getText = useCallback((key: keyof TextConfig): string => {
    return texts[key] || defaultTexts[key] || '';
  }, [texts]);

  return (
    <InterfaceTextsContext.Provider value={{ texts, icons, loading, getIcon, getText, refetch: fetchSettings }}>
      {children}
    </InterfaceTextsContext.Provider>
  );
};

export const useInterfaceTexts = () => {
  const context = useContext(InterfaceTextsContext);
  if (!context) {
    // Return default values if used outside provider
    return {
      texts: defaultTexts,
      icons: defaultIcons,
      loading: false,
      getIcon: (key: keyof IconConfig) => AVAILABLE_ICONS[defaultIcons[key]] || AVAILABLE_ICONS.Package,
      getText: (key: keyof TextConfig) => defaultTexts[key] || '',
      refetch: async () => {},
    };
  }
  return context;
};

// Export for use in StatusBadge and other components
export { AVAILABLE_ICONS };
export type { IconName };
