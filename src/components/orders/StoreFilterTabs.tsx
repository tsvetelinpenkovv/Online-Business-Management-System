import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { Store } from '@/hooks/useStores';

interface StoreFilterTabsProps {
  stores: Store[];
  selectedStoreId: string | null; // null = all
  onSelectStore: (storeId: string | null) => void;
  orderCountByStore: Record<string, number>;
  totalOrders: number;
}

export const StoreFilterTabs = ({
  stores,
  selectedStoreId,
  onSelectStore,
  orderCountByStore,
  totalOrders,
}: StoreFilterTabsProps) => {
  const enabledStores = useMemo(() => stores.filter(s => s.is_enabled), [stores]);

  if (enabledStores.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <Button
        variant={selectedStoreId === null ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectStore(null)}
        className="gap-1.5 h-8 text-xs"
      >
        <Globe className="w-3.5 h-3.5" />
        Всички
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
          {totalOrders}
        </Badge>
      </Button>
      {enabledStores.map((store) => (
        <Button
          key={store.id}
          variant={selectedStoreId === store.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectStore(store.id)}
          className="gap-1.5 h-8 text-xs"
        >
          <span className="text-sm">{store.flag_emoji}</span>
          <span className="hidden sm:inline">{store.country_name}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
            {orderCountByStore[store.id] || 0}
          </Badge>
        </Button>
      ))}
    </div>
  );
};
