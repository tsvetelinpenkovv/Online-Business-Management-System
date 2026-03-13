import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from '@/components/SecretPathGuard';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import {
  Search, Package, Users, Euro, BarChart3, Warehouse,
  RotateCcw, MessageCircle, ShieldAlert, Settings,
  Building2, Truck, ShoppingCart, Globe, Bell, Zap,
  BookOpen, Shield, Type, Paintbrush, Tags, Percent,
  Plus, FileSpreadsheet, Printer, Store, Database,
} from 'lucide-react';

interface GlobalSearchDialogProps {
  trigger?: React.ReactNode;
}

const NAVIGATION_ITEMS = [
  { label: 'Поръчки', icon: Package, path: '/', keywords: 'orders поръчки' },
  { label: 'CRM - Клиенти', icon: Users, path: '/crm', keywords: 'crm клиенти customers' },
  { label: 'Финанси', icon: Euro, path: '/finance', keywords: 'finance финанси плащания payments' },
  { label: 'Аналитика', icon: BarChart3, path: '/analytics', keywords: 'analytics аналитика отчети reports' },
  { label: 'Склад', icon: Warehouse, path: '/inventory', keywords: 'inventory склад продукти products' },
  { label: 'Връщания', icon: RotateCcw, path: '/returns', keywords: 'returns връщания рекламации' },
  { label: 'Съобщения', icon: MessageCircle, path: '/messages', keywords: 'messages съобщения viber sms' },
  { label: 'Nekorekten', icon: ShieldAlert, path: '/nekorekten', keywords: 'nekorekten некоректен проверка' },
  { label: 'Настройки', icon: Settings, path: '/settings', keywords: 'settings настройки' },
];

const SETTINGS_ITEMS = [
  { label: 'Фирмени данни', icon: Building2, path: '/settings?tab=company', keywords: 'company фирма еик' },
  { label: 'Статуси на поръчки', icon: Tags, path: '/settings?tab=statuses', keywords: 'statuses статуси' },
  { label: 'Куриерски API', icon: Truck, path: '/settings?tab=courier-api', keywords: 'courier куриер api' },
  { label: 'Е-commerce платформи', icon: ShoppingCart, path: '/settings?tab=platforms', keywords: 'platforms woocommerce shopify opencart' },
  { label: 'Източници', icon: Globe, path: '/settings?tab=sources', keywords: 'sources източници' },
  { label: 'Connectix (Viber/SMS)', icon: Zap, path: '/settings?tab=connectix', keywords: 'connectix viber sms' },
  { label: 'Магазини', icon: Store, path: '/settings?tab=stores', keywords: 'stores магазини мулти' },
  { label: 'Промокодове', icon: Percent, path: '/settings?tab=promo', keywords: 'promo промокодове отстъпки' },
  { label: 'Интерфейс текстове', icon: Type, path: '/settings?tab=interface', keywords: 'interface текстове' },
  { label: 'Глобален цвят', icon: Paintbrush, path: '/settings?tab=color', keywords: 'color цвят тема' },
  { label: 'Сайт персонализация', icon: Paintbrush, path: '/settings?tab=customization', keywords: 'customization css персонализация' },
  { label: 'Известия и звуци', icon: Bell, path: '/settings?tab=notifications', keywords: 'notifications известия звуци' },
  { label: 'Роли и права', icon: Shield, path: '/settings?tab=roles', keywords: 'roles роли права permissions' },
  { label: 'Потребители', icon: Users, path: '/settings?tab=users', keywords: 'users потребители' },
  { label: 'Webhooks', icon: Zap, path: '/settings?tab=webhooks', keywords: 'webhooks' },
  { label: 'Кеш мениджмънт', icon: Database, path: '/settings?tab=cache', keywords: 'cache кеш' },
  { label: 'Документация', icon: BookOpen, path: '/settings?tab=docs', keywords: 'docs документация помощ' },
];

const ACTION_ITEMS = [
  { label: 'Нова поръчка', icon: Plus, path: '/?action=new-order', keywords: 'new order нова поръчка' },
  { label: 'Нов продукт', icon: Plus, path: '/inventory?tab=products', keywords: 'new product нов продукт' },
  { label: 'Импорт/Експорт', icon: FileSpreadsheet, path: '/inventory?action=import', keywords: 'import export импорт експорт' },
  { label: 'Печат', icon: Printer, path: '', keywords: 'print печат', action: 'print' },
];

export const GlobalSearchDialog = ({ trigger }: GlobalSearchDialogProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((item: { path?: string; action?: string }) => {
    setOpen(false);
    if (item.action === 'print') {
      window.print();
      return;
    }
    if (item.path) {
      navigate(buildPath(item.path));
    }
  }, [navigate]);

  return (
    <>
      {trigger || (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          title="Търсене (Ctrl+K)"
          className="relative"
        >
          <Search className="w-4 h-4" />
        </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Търси в менюта, настройки, действия..." />
        <CommandList>
          <CommandEmpty>Няма намерени резултати.</CommandEmpty>
          <CommandGroup heading="Навигация">
            {NAVIGATION_ITEMS.map(item => (
              <CommandItem
                key={item.path}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => handleSelect(item)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Настройки">
            {SETTINGS_ITEMS.map(item => (
              <CommandItem
                key={item.path}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => handleSelect(item)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Бързи действия">
            {ACTION_ITEMS.map(item => (
              <CommandItem
                key={item.label}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => handleSelect(item)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};
