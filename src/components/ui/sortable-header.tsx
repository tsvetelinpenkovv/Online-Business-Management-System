import { FC, ReactNode } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { TableHead } from './table';

interface SortableHeaderProps<T extends string> {
  columnKey: T;
  sortKey: T;
  sortDirection: 'asc' | 'desc';
  onSort: (key: T) => void;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function SortableHeader<T extends string>({ 
  columnKey, 
  sortKey, 
  sortDirection,
  onSort, 
  children,
  className = '',
  align = 'left',
}: SortableHeaderProps<T>) {
  const alignClass = align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : '';
  
  return (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${alignClass} ${className}`}
      onClick={() => onSort(columnKey)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        <ArrowUpDown className={`w-3 h-3 flex-shrink-0 ${sortKey === columnKey ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );
}
