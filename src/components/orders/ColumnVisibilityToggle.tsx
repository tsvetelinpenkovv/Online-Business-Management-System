import { FC } from 'react';
import { Settings2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type ColumnKey = 
  | 'id' 
  | 'source' 
  | 'date' 
  | 'customer' 
  | 'correct' 
  | 'phone' 
  | 'price' 
  | 'product' 
  | 'catalog' 
  | 'quantity' 
  | 'delivery' 
  | 'tracking' 
  | 'status' 
  | 'comment';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

export const COLUMNS_CONFIG: ColumnConfig[] = [
  { key: 'id', label: 'ID', defaultVisible: true },
  { key: 'source', label: 'Източник', defaultVisible: true },
  { key: 'date', label: 'Дата', defaultVisible: true },
  { key: 'customer', label: 'Клиент', defaultVisible: true },
  { key: 'correct', label: 'Коректност', defaultVisible: true },
  { key: 'phone', label: 'Телефон', defaultVisible: true },
  { key: 'price', label: 'Цена', defaultVisible: true },
  { key: 'product', label: 'Продукт', defaultVisible: true },
  { key: 'catalog', label: 'Кат.№', defaultVisible: true },
  { key: 'quantity', label: 'Количество', defaultVisible: true },
  { key: 'delivery', label: 'Доставка', defaultVisible: true },
  { key: 'tracking', label: 'Товарителница', defaultVisible: true },
  { key: 'status', label: 'Статус', defaultVisible: true },
  { key: 'comment', label: 'Коментар', defaultVisible: true },
];

const STORAGE_KEY = 'orders_visible_columns';

export const getDefaultVisibleColumns = (): Set<ColumnKey> => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return new Set(parsed as ColumnKey[]);
    } catch {
      // Invalid stored data, use defaults
    }
  }
  return new Set(COLUMNS_CONFIG.filter(c => c.defaultVisible).map(c => c.key));
};

export const saveVisibleColumns = (columns: Set<ColumnKey>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...columns]));
};

interface ColumnVisibilityToggleProps {
  visibleColumns: Set<ColumnKey>;
  onToggle: (column: ColumnKey) => void;
  nekorektenEnabled?: boolean;
}

export const ColumnVisibilityToggle: FC<ColumnVisibilityToggleProps> = ({
  visibleColumns,
  onToggle,
  nekorektenEnabled = true,
}) => {
  const availableColumns = COLUMNS_CONFIG.filter(
    col => col.key !== 'correct' || nekorektenEnabled
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          Колони
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DropdownMenuLabel>Покажи/скрий колони</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableColumns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.key}
            checked={visibleColumns.has(column.key)}
            onCheckedChange={() => onToggle(column.key)}
            onSelect={(e) => e.preventDefault()}
          >
            {visibleColumns.has(column.key) ? (
              <Eye className="w-3 h-3 mr-2 text-success" />
            ) : (
              <EyeOff className="w-3 h-3 mr-2 text-muted-foreground" />
            )}
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
