import { FC, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, RotateCcw, Package, Boxes, Search, Type, Layout } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TextConfig {
  // Orders page
  orders_page_title: string;
  orders_header_subtitle: string;
  orders_search_placeholder: string;
  orders_status_filter_label: string;
  orders_source_filter_label: string;
  orders_date_from_label: string;
  orders_date_to_label: string;
  orders_clear_filters_label: string;
  orders_add_button_label: string;
  orders_export_csv_label: string;
  orders_export_xml_label: string;
  orders_refresh_label: string;
  orders_messages_button_label: string;
  orders_warehouse_button_label: string;
  orders_nekorekten_button_label: string;
  orders_settings_button_label: string;
  orders_logout_button_label: string;
  
  // Orders table
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
  
  // Inventory page
  inventory_page_title: string;
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
}

const defaultTexts: TextConfig = {
  // Orders page
  orders_page_title: 'Управление на поръчки',
  orders_header_subtitle: 'поръчки',
  orders_search_placeholder: 'Търси клиент, телефон, ID...',
  orders_status_filter_label: 'Статуси',
  orders_source_filter_label: 'Източници',
  orders_date_from_label: 'От дата',
  orders_date_to_label: 'До дата',
  orders_clear_filters_label: 'Изчисти',
  orders_add_button_label: 'Нова поръчка',
  orders_export_csv_label: 'Експорт в CSV',
  orders_export_xml_label: 'Експорт в XML',
  orders_refresh_label: 'Обнови',
  orders_messages_button_label: 'Съобщения',
  orders_warehouse_button_label: 'Склад',
  orders_nekorekten_button_label: 'Некоректен',
  orders_settings_button_label: 'Настройки',
  orders_logout_button_label: 'Изход',
  
  // Orders table
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
  
  // Inventory page
  inventory_page_title: 'Складова програма',
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
};

const SETTING_KEY = 'interface_texts';

export const InterfaceTextEditor: FC = () => {
  const [texts, setTexts] = useState<TextConfig>(defaultTexts);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('orders');
  const { toast } = useToast();

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', SETTING_KEY)
        .maybeSingle();

      if (data?.setting_value) {
        const savedTexts = JSON.parse(data.setting_value);
        setTexts({ ...defaultTexts, ...savedTexts });
      }
    } catch (error) {
      console.error('Error loading texts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTexts = async () => {
    setSaving(true);
    try {
      await supabase
        .from('api_settings')
        .upsert({
          setting_key: SETTING_KEY,
          setting_value: JSON.stringify(texts),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      toast({
        title: 'Успех',
        description: 'Текстовете бяха запазени успешно',
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на текстовете',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setTexts(defaultTexts);
    toast({
      title: 'Информация',
      description: 'Текстовете бяха възстановени до стойностите по подразбиране. Натиснете "Запази" за да запазите промените.',
    });
  };

  const updateText = (key: keyof TextConfig, value: string) => {
    setTexts(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ordersPageTexts = [
    { key: 'orders_page_title', label: 'Заглавие на страницата' },
    { key: 'orders_header_subtitle', label: 'Подзаглавие (брой поръчки)' },
    { key: 'orders_search_placeholder', label: 'Placeholder за търсене' },
    { key: 'orders_status_filter_label', label: 'Етикет за филтър статуси' },
    { key: 'orders_source_filter_label', label: 'Етикет за филтър източници' },
    { key: 'orders_date_from_label', label: 'Етикет "От дата"' },
    { key: 'orders_date_to_label', label: 'Етикет "До дата"' },
    { key: 'orders_clear_filters_label', label: 'Бутон "Изчисти филтри"' },
    { key: 'orders_add_button_label', label: 'Бутон "Нова поръчка"' },
    { key: 'orders_export_csv_label', label: 'Бутон "Експорт CSV"' },
    { key: 'orders_export_xml_label', label: 'Бутон "Експорт XML"' },
    { key: 'orders_refresh_label', label: 'Бутон "Обнови"' },
    { key: 'orders_messages_button_label', label: 'Бутон "Съобщения"' },
    { key: 'orders_warehouse_button_label', label: 'Бутон "Склад"' },
    { key: 'orders_nekorekten_button_label', label: 'Бутон "Некоректен"' },
    { key: 'orders_settings_button_label', label: 'Бутон "Настройки"' },
    { key: 'orders_logout_button_label', label: 'Бутон "Изход"' },
  ] as const;

  const ordersTableTexts = [
    { key: 'orders_table_id_header', label: 'Колона "ID"' },
    { key: 'orders_table_date_header', label: 'Колона "Дата"' },
    { key: 'orders_table_customer_header', label: 'Колона "Клиент"' },
    { key: 'orders_table_product_header', label: 'Колона "Продукт"' },
    { key: 'orders_table_quantity_header', label: 'Колона "Количество"' },
    { key: 'orders_table_price_header', label: 'Колона "Цена"' },
    { key: 'orders_table_status_header', label: 'Колона "Статус"' },
    { key: 'orders_table_courier_header', label: 'Колона "Куриер"' },
    { key: 'orders_table_actions_header', label: 'Колона "Действия"' },
    { key: 'orders_table_source_header', label: 'Колона "Източник"' },
  ] as const;

  const inventoryPageTexts = [
    { key: 'inventory_page_title', label: 'Заглавие на страницата' },
    { key: 'inventory_dashboard_tab', label: 'Таб "Табло"' },
    { key: 'inventory_products_tab', label: 'Таб "Продукти"' },
    { key: 'inventory_suppliers_tab', label: 'Таб "Доставчици"' },
    { key: 'inventory_categories_tab', label: 'Таб "Категории"' },
    { key: 'inventory_documents_tab', label: 'Таб "Документи"' },
    { key: 'inventory_movements_tab', label: 'Таб "Движения"' },
    { key: 'inventory_reports_tab', label: 'Таб "Справки"' },
    { key: 'inventory_forecast_tab', label: 'Таб "Прогнози"' },
  ] as const;

  const inventoryDashboardTexts = [
    { key: 'inventory_total_products_label', label: 'Етикет "Общо продукти"' },
    { key: 'inventory_low_stock_label', label: 'Етикет "Нисък запас"' },
    { key: 'inventory_out_of_stock_label', label: 'Етикет "Без наличност"' },
    { key: 'inventory_total_value_label', label: 'Етикет "Стойност на склада"' },
    { key: 'inventory_sale_value_label', label: 'Етикет "Продажна стойност"' },
    { key: 'inventory_potential_profit_label', label: 'Етикет "Потенциална печалба"' },
    { key: 'inventory_suppliers_count_label', label: 'Етикет "Доставчици"' },
  ] as const;

  const commonTexts = [
    { key: 'common_save_button', label: 'Бутон "Запази"' },
    { key: 'common_cancel_button', label: 'Бутон "Отказ"' },
    { key: 'common_delete_button', label: 'Бутон "Изтрий"' },
    { key: 'common_edit_button', label: 'Бутон "Редактирай"' },
    { key: 'common_add_button', label: 'Бутон "Добави"' },
    { key: 'common_search_label', label: 'Етикет "Търсене"' },
    { key: 'common_loading_text', label: 'Текст "Зареждане"' },
    { key: 'common_no_data_text', label: 'Текст "Няма данни"' },
    { key: 'common_confirm_delete_title', label: 'Заглавие за потвърждение изтриване' },
    { key: 'common_confirm_delete_description', label: 'Описание за потвърждение изтриване' },
  ] as const;

  const renderTextFields = (fields: readonly { key: string; label: string }[]) => (
    <div className="grid gap-4">
      {fields.map(({ key, label }) => (
        <div key={key} className="grid gap-2">
          <Label htmlFor={key} className="text-sm font-medium">
            {label}
          </Label>
          <Input
            id={key}
            value={texts[key as keyof TextConfig]}
            onChange={(e) => updateText(key as keyof TextConfig, e.target.value)}
            placeholder={defaultTexts[key as keyof TextConfig]}
          />
        </div>
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
              <CardTitle>Редактор на текстове</CardTitle>
              <CardDescription>
                Персонализирайте всички текстове в интерфейса
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Поръчки
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Boxes className="w-4 h-4" />
              Склад
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Accordion type="multiple" defaultValue={['page', 'table']} className="space-y-2">
                <AccordionItem value="page" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Страница с поръчки
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderTextFields(ordersPageTexts)}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="table" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Таблица с поръчки
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderTextFields(ordersTableTexts)}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="common" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Общи текстове
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderTextFields(commonTexts)}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ScrollArea className="h-[500px] pr-4">
              <Accordion type="multiple" defaultValue={['inv-page', 'inv-dashboard']} className="space-y-2">
                <AccordionItem value="inv-page" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Страница склад
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderTextFields(inventoryPageTexts)}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inv-dashboard" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4" />
                      Табло на склада
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {renderTextFields(inventoryDashboardTexts)}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Възстанови по подразбиране
          </Button>
          <Button onClick={saveTexts} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Запази промените
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
