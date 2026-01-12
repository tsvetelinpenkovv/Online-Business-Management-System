import { FC, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Save, Loader2, RotateCcw, Package, Warehouse, Search, Type, Layout, 
  MessageCircle, ShieldAlert, Settings, LogOut, Plus, Trash2, Printer,
  Download, RefreshCw, Filter, Calendar, Globe, BarChart3, X, FileText,
  Eye, Edit, Check, Clock, Truck, Box, Users, Boxes, FileBox, Receipt,
  Tags, Phone, Mail, MapPin, Hash, DollarSign, ShoppingCart, Archive,
  Clipboard, AlertTriangle, TrendingUp, PieChart, Activity, Layers,
  FolderOpen, FileInput, FileOutput, ArrowLeftRight, ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Available icons for selection
const AVAILABLE_ICONS = {
  Package, Warehouse, Search, Type, Layout, MessageCircle, ShieldAlert, 
  Settings, LogOut, Plus, Trash2, Printer, Download, RefreshCw, Filter, 
  Calendar, Globe, BarChart3, X, FileText, Eye, Edit, Check, Clock, 
  Truck, Box, Users, Boxes, FileBox, Receipt, Tags, Phone, Mail, MapPin, 
  Hash, DollarSign, ShoppingCart, Archive, Clipboard, AlertTriangle,
  TrendingUp, PieChart, Activity, Layers, FolderOpen, FileInput, FileOutput,
  ArrowLeftRight, ChevronDown
};

type IconName = keyof typeof AVAILABLE_ICONS;

interface TextConfig {
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
  orders_columns_label: string;
  orders_columns_header_label: string;
  
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

interface IconConfig {
  // Orders page icons
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
  
  // Inventory page icons
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
  // Orders page header
  orders_page_title: 'Управление на поръчки',
  orders_header_subtitle: 'поръчки',
  orders_loading_text: 'Зареждане на поръчки...',
  orders_no_orders_text: 'Няма намерени поръчки',
  
  // Orders filters
  orders_search_placeholder: 'Търси клиент, телефон, ID...',
  orders_status_filter_label: 'Статуси',
  orders_source_filter_label: 'Източници',
  orders_date_from_label: 'От дата',
  orders_date_to_label: 'До дата',
  orders_clear_filters_label: 'Изчисти',
  orders_statistics_button: 'Статистика',
  
  // Orders buttons
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
  orders_columns_label: 'Колони',
  orders_columns_header_label: 'Покажи/скрий колони',
  
  // Orders table headers
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
  
  // Orders actions
  orders_edit_action: 'Редактирай',
  orders_delete_action: 'Изтрий',
  orders_print_action: 'Печат',
  orders_invoice_action: 'Фактура',
  orders_tracking_action: 'Проследяване',
  
  // Add order dialog
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
  
  // Inventory page
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
  
  // Inventory dashboard
  inventory_total_products_label: 'Общо продукти',
  inventory_low_stock_label: 'Нисък запас',
  inventory_out_of_stock_label: 'Без наличност',
  inventory_total_value_label: 'Стойност на склада',
  inventory_sale_value_label: 'Продажна стойност',
  inventory_potential_profit_label: 'Потенциална печалба',
  inventory_suppliers_count_label: 'Доставчици',
  inventory_low_stock_alerts_title: 'Предупреждения за нисък запас',
  inventory_recent_movements_title: 'Последни движения',
  
  // Inventory products
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
  
  // Inventory suppliers
  inventory_add_supplier_button: 'Добави доставчик',
  inventory_supplier_name: 'Име на доставчик',
  inventory_supplier_contact: 'Лице за контакт',
  inventory_supplier_phone: 'Телефон',
  inventory_supplier_email: 'Имейл',
  inventory_supplier_address: 'Адрес',
  
  // Inventory documents
  inventory_add_document_button: 'Нов документ',
  inventory_document_number: 'Номер',
  inventory_document_type: 'Тип',
  inventory_document_date: 'Дата',
  inventory_document_supplier: 'Доставчик',
  inventory_document_total: 'Сума',
  
  // Common
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
  // Orders page icons
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
  
  // Inventory page icons
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

const IconSelector: FC<{ value: IconName; onChange: (icon: IconName) => void; label: string }> = ({ value, onChange, label }) => {
  const [open, setOpen] = useState(false);
  const IconComponent = AVAILABLE_ICONS[value] || Package;
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <IconComponent className="w-4 h-4" />
              <span>{value}</span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <ScrollArea className="h-[250px]">
            <div className="grid grid-cols-5 gap-1">
              {Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
                <Button
                  key={name}
                  variant={value === name ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    onChange(name as IconName);
                    setOpen(false);
                  }}
                  title={name}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const InterfaceTextEditor: FC = () => {
  const [texts, setTexts] = useState<TextConfig>(defaultTexts);
  const [icons, setIcons] = useState<IconConfig>(defaultIcons);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('orders');
  const [editMode, setEditMode] = useState<'texts' | 'icons'>('texts');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
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
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('api_settings').upsert({
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(texts),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' }),
        supabase.from('api_settings').upsert({
          setting_key: ICONS_SETTING_KEY,
          setting_value: JSON.stringify(icons),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' }),
      ]);

      toast({
        title: 'Успех',
        description: 'Настройките бяха запазени успешно',
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройките',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (editMode === 'texts') {
      setTexts(defaultTexts);
    } else {
      setIcons(defaultIcons);
    }
    toast({
      title: 'Информация',
      description: 'Настройките бяха възстановени. Натиснете "Запази" за да запазите промените.',
    });
  };

  const updateText = (key: keyof TextConfig, value: string) => {
    setTexts(prev => ({ ...prev, [key]: value }));
  };

  const updateIcon = (key: keyof IconConfig, value: IconName) => {
    setIcons(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ordersHeaderTexts = [
    { key: 'orders_page_title', label: 'Заглавие на страницата' },
    { key: 'orders_header_subtitle', label: 'Текст за брой поръчки' },
    { key: 'orders_loading_text', label: 'Текст при зареждане' },
    { key: 'orders_no_orders_text', label: 'Текст когато няма поръчки' },
  ] as const;

  const ordersFiltersTexts = [
    { key: 'orders_search_placeholder', label: 'Placeholder за търсене' },
    { key: 'orders_status_filter_label', label: 'Филтър статуси' },
    { key: 'orders_source_filter_label', label: 'Филтър източници' },
    { key: 'orders_date_from_label', label: 'От дата' },
    { key: 'orders_date_to_label', label: 'До дата' },
    { key: 'orders_clear_filters_label', label: 'Изчисти филтри' },
    { key: 'orders_statistics_button', label: 'Бутон статистика' },
  ] as const;

  const ordersButtonsTexts = [
    { key: 'orders_add_button_label', label: 'Нова поръчка' },
    { key: 'orders_export_csv_label', label: 'Експорт CSV' },
    { key: 'orders_export_xml_label', label: 'Експорт XML' },
    { key: 'orders_refresh_label', label: 'Обнови' },
    { key: 'orders_messages_button_label', label: 'Съобщения' },
    { key: 'orders_warehouse_button_label', label: 'Склад' },
    { key: 'orders_nekorekten_button_label', label: 'Некоректен' },
    { key: 'orders_settings_button_label', label: 'Настройки' },
    { key: 'orders_logout_button_label', label: 'Изход' },
    { key: 'orders_print_receipts_label', label: 'Печат поръчки' },
    { key: 'orders_print_waybills_label', label: 'Печат товарителници' },
    { key: 'orders_print_invoices_label', label: 'Печат фактури' },
    { key: 'orders_change_status_label', label: 'Смени статус' },
    { key: 'orders_delete_selected_label', label: 'Изтрий избраните' },
    { key: 'orders_columns_label', label: 'Бутон Колони' },
    { key: 'orders_columns_header_label', label: 'Заглавие на меню Колони' },
  ] as const;

  const ordersTableTexts = [
    { key: 'orders_table_id_header', label: 'Колона ID' },
    { key: 'orders_table_date_header', label: 'Колона Дата' },
    { key: 'orders_table_customer_header', label: 'Колона Клиент' },
    { key: 'orders_table_product_header', label: 'Колона Продукт' },
    { key: 'orders_table_quantity_header', label: 'Колона Количество' },
    { key: 'orders_table_price_header', label: 'Колона Цена' },
    { key: 'orders_table_status_header', label: 'Колона Статус' },
    { key: 'orders_table_courier_header', label: 'Колона Куриер' },
    { key: 'orders_table_actions_header', label: 'Колона Действия' },
    { key: 'orders_table_source_header', label: 'Колона Източник' },
    { key: 'orders_table_correct_header', label: 'Колона Коректност' },
    { key: 'orders_table_message_header', label: 'Колона Съобщение' },
  ] as const;

  const ordersActionsTexts = [
    { key: 'orders_edit_action', label: 'Действие Редактирай' },
    { key: 'orders_delete_action', label: 'Действие Изтрий' },
    { key: 'orders_print_action', label: 'Действие Печат' },
    { key: 'orders_invoice_action', label: 'Действие Фактура' },
    { key: 'orders_tracking_action', label: 'Действие Проследяване' },
  ] as const;

  const ordersDialogTexts = [
    { key: 'orders_add_dialog_title', label: 'Заглавие на диалога' },
    { key: 'orders_add_dialog_customer_name', label: 'Поле Име на клиент' },
    { key: 'orders_add_dialog_phone', label: 'Поле Телефон' },
    { key: 'orders_add_dialog_email', label: 'Поле Имейл' },
    { key: 'orders_add_dialog_product_name', label: 'Поле Продукт' },
    { key: 'orders_add_dialog_catalog_number', label: 'Поле Каталожен номер' },
    { key: 'orders_add_dialog_quantity', label: 'Поле Количество' },
    { key: 'orders_add_dialog_price', label: 'Поле Цена' },
    { key: 'orders_add_dialog_address', label: 'Поле Адрес' },
    { key: 'orders_add_dialog_source', label: 'Поле Източник' },
    { key: 'orders_add_dialog_comment', label: 'Поле Коментар' },
    { key: 'orders_add_dialog_add_product', label: 'Бутон Добави продукт' },
    { key: 'orders_add_dialog_total_price', label: 'Етикет Обща цена' },
  ] as const;

  const inventoryPageTexts = [
    { key: 'inventory_page_title', label: 'Заглавие на страницата' },
    { key: 'inventory_loading_text', label: 'Текст при зареждане' },
    { key: 'inventory_dashboard_tab', label: 'Таб Табло' },
    { key: 'inventory_products_tab', label: 'Таб Продукти' },
    { key: 'inventory_suppliers_tab', label: 'Таб Доставчици' },
    { key: 'inventory_categories_tab', label: 'Таб Категории' },
    { key: 'inventory_documents_tab', label: 'Таб Документи' },
    { key: 'inventory_movements_tab', label: 'Таб Движения' },
    { key: 'inventory_reports_tab', label: 'Таб Справки' },
    { key: 'inventory_forecast_tab', label: 'Таб Прогнози' },
  ] as const;

  const inventoryDashboardTexts = [
    { key: 'inventory_total_products_label', label: 'Общо продукти' },
    { key: 'inventory_low_stock_label', label: 'Нисък запас' },
    { key: 'inventory_out_of_stock_label', label: 'Без наличност' },
    { key: 'inventory_total_value_label', label: 'Стойност на склада' },
    { key: 'inventory_sale_value_label', label: 'Продажна стойност' },
    { key: 'inventory_potential_profit_label', label: 'Потенциална печалба' },
    { key: 'inventory_suppliers_count_label', label: 'Брой доставчици' },
    { key: 'inventory_low_stock_alerts_title', label: 'Заглавие предупреждения' },
    { key: 'inventory_recent_movements_title', label: 'Заглавие последни движения' },
  ] as const;

  const inventoryProductsTexts = [
    { key: 'inventory_add_product_button', label: 'Бутон добави продукт' },
    { key: 'inventory_search_products', label: 'Търсене на продукти' },
    { key: 'inventory_product_name', label: 'Колона Име' },
    { key: 'inventory_product_sku', label: 'Колона SKU' },
    { key: 'inventory_product_barcode', label: 'Колона Баркод' },
    { key: 'inventory_product_category', label: 'Колона Категория' },
    { key: 'inventory_product_stock', label: 'Колона Наличност' },
    { key: 'inventory_product_min_stock', label: 'Колона Мин. наличност' },
    { key: 'inventory_product_purchase_price', label: 'Колона Покупна цена' },
    { key: 'inventory_product_sale_price', label: 'Колона Продажна цена' },
  ] as const;

  const inventorySuppliersTexts = [
    { key: 'inventory_add_supplier_button', label: 'Бутон добави доставчик' },
    { key: 'inventory_supplier_name', label: 'Колона Име' },
    { key: 'inventory_supplier_contact', label: 'Колона Контакт' },
    { key: 'inventory_supplier_phone', label: 'Колона Телефон' },
    { key: 'inventory_supplier_email', label: 'Колона Имейл' },
    { key: 'inventory_supplier_address', label: 'Колона Адрес' },
  ] as const;

  const inventoryDocumentsTexts = [
    { key: 'inventory_add_document_button', label: 'Бутон нов документ' },
    { key: 'inventory_document_number', label: 'Колона Номер' },
    { key: 'inventory_document_type', label: 'Колона Тип' },
    { key: 'inventory_document_date', label: 'Колона Дата' },
    { key: 'inventory_document_supplier', label: 'Колона Доставчик' },
    { key: 'inventory_document_total', label: 'Колона Сума' },
  ] as const;

  const commonTextsConfig = [
    { key: 'common_save_button', label: 'Бутон Запази' },
    { key: 'common_cancel_button', label: 'Бутон Отказ' },
    { key: 'common_delete_button', label: 'Бутон Изтрий' },
    { key: 'common_edit_button', label: 'Бутон Редактирай' },
    { key: 'common_add_button', label: 'Бутон Добави' },
    { key: 'common_search_label', label: 'Етикет Търсене' },
    { key: 'common_loading_text', label: 'Текст Зареждане' },
    { key: 'common_no_data_text', label: 'Текст Няма данни' },
    { key: 'common_confirm_delete_title', label: 'Заглавие потвърждение изтриване' },
    { key: 'common_confirm_delete_description', label: 'Описание потвърждение изтриване' },
    { key: 'common_success_message', label: 'Съобщение за успех' },
    { key: 'common_error_message', label: 'Съобщение за грешка' },
    { key: 'common_page_label', label: 'Етикет Страница' },
    { key: 'common_of_label', label: 'Етикет от' },
  ] as const;

  const ordersIcons = [
    { key: 'orders_add_icon', label: 'Иконка Нова поръчка' },
    { key: 'orders_export_icon', label: 'Иконка Експорт' },
    { key: 'orders_refresh_icon', label: 'Иконка Обнови' },
    { key: 'orders_messages_icon', label: 'Иконка Съобщения' },
    { key: 'orders_warehouse_icon', label: 'Иконка Склад' },
    { key: 'orders_nekorekten_icon', label: 'Иконка Некоректен' },
    { key: 'orders_settings_icon', label: 'Иконка Настройки' },
    { key: 'orders_logout_icon', label: 'Иконка Изход' },
    { key: 'orders_print_icon', label: 'Иконка Печат' },
    { key: 'orders_delete_icon', label: 'Иконка Изтрий' },
    { key: 'orders_edit_icon', label: 'Иконка Редактирай' },
    { key: 'orders_search_icon', label: 'Иконка Търсене' },
    { key: 'orders_filter_icon', label: 'Иконка Филтър' },
    { key: 'orders_calendar_icon', label: 'Иконка Календар' },
    { key: 'orders_statistics_icon', label: 'Иконка Статистика' },
  ] as const;

  const inventoryIcons = [
    { key: 'inventory_dashboard_icon', label: 'Иконка Табло' },
    { key: 'inventory_products_icon', label: 'Иконка Продукти' },
    { key: 'inventory_suppliers_icon', label: 'Иконка Доставчици' },
    { key: 'inventory_categories_icon', label: 'Иконка Категории' },
    { key: 'inventory_documents_icon', label: 'Иконка Документи' },
    { key: 'inventory_movements_icon', label: 'Иконка Движения' },
    { key: 'inventory_reports_icon', label: 'Иконка Справки' },
    { key: 'inventory_forecast_icon', label: 'Иконка Прогнози' },
    { key: 'inventory_add_icon', label: 'Иконка Добави' },
    { key: 'inventory_scan_icon', label: 'Иконка Сканиране' },
    { key: 'inventory_import_icon', label: 'Иконка Импорт' },
    { key: 'inventory_refresh_icon', label: 'Иконка Обнови' },
  ] as const;

  const renderTextFields = (fields: readonly { key: string; label: string }[]) => (
    <div className="grid gap-3">
      {fields.map(({ key, label }) => (
        <div key={key} className="grid gap-1.5">
          <Label htmlFor={key} className="text-xs font-medium text-muted-foreground">
            {label}
          </Label>
          <Input
            id={key}
            value={texts[key as keyof TextConfig]}
            onChange={(e) => updateText(key as keyof TextConfig, e.target.value)}
            placeholder={defaultTexts[key as keyof TextConfig]}
            className="h-9"
          />
        </div>
      ))}
    </div>
  );

  const renderIconFields = (fields: readonly { key: string; label: string }[]) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ key, label }) => (
        <IconSelector
          key={key}
          value={icons[key as keyof IconConfig]}
          onChange={(value) => updateIcon(key as keyof IconConfig, value)}
          label={label}
        />
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Редактор на интерфейса</CardTitle>
              <CardDescription>
                Персонализирайте всички текстове и иконки
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Edit mode toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={editMode === 'texts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode('texts')}
          >
            <Type className="w-4 h-4 mr-2" />
            Текстове
          </Button>
          <Button
            variant={editMode === 'icons' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode('icons')}
          >
            <Layout className="w-4 h-4 mr-2" />
            Иконки
          </Button>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Поръчки
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Warehouse className="w-4 h-4" />
              Склад
            </TabsTrigger>
          </TabsList>

          {editMode === 'texts' ? (
            <>
              <TabsContent value="orders" className="space-y-4">
                <ScrollArea className="h-[450px] pr-4">
                  <Accordion type="multiple" defaultValue={['header', 'filters', 'buttons', 'table']} className="space-y-2">
                    <AccordionItem value="header" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Хедър и общи</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersHeaderTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="filters" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Филтри</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersFiltersTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="buttons" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Бутони</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersButtonsTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="table" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Таблица</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersTableTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="actions" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Действия</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersActionsTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="dialog" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Диалог добавяне</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(ordersDialogTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="common" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Общи текстове</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(commonTextsConfig)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <ScrollArea className="h-[450px] pr-4">
                  <Accordion type="multiple" defaultValue={['inv-page', 'inv-dashboard']} className="space-y-2">
                    <AccordionItem value="inv-page" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Страница и табове</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(inventoryPageTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="inv-dashboard" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Табло</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(inventoryDashboardTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="inv-products" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Продукти</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(inventoryProductsTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="inv-suppliers" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Доставчици</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(inventorySuppliersTexts)}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="inv-documents" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <span className="text-sm font-medium">Документи</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {renderTextFields(inventoryDocumentsTexts)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </ScrollArea>
              </TabsContent>
            </>
          ) : (
            <>
              <TabsContent value="orders" className="space-y-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Иконки на бутони и елементи</h3>
                    {renderIconFields(ordersIcons)}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Иконки на табове и бутони</h3>
                    {renderIconFields(inventoryIcons)}
                  </div>
                </ScrollArea>
              </TabsContent>
            </>
          )}
        </Tabs>

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Възстанови
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Запази
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
