import { FC } from 'react';
import { Search, Filter, Calendar, X, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ORDER_STATUSES, OrderStatus } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { SourceIcon } from '@/components/icons/SourceIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
}

export const OrderFilters: FC<OrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}) => {
  const hasFilters = searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Търсене по клиент, телефон, ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всички статуси</SelectItem>
          {ORDER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Източник" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Всички източници
            </div>
          </SelectItem>
          <SelectItem value="google">
            <div className="flex items-center gap-2">
              <SourceIcon source="google" className="w-4 h-4" />
              Google
            </div>
          </SelectItem>
          <SelectItem value="facebook">
            <div className="flex items-center gap-2">
              <SourceIcon source="facebook" className="w-4 h-4" />
              Facebook
            </div>
          </SelectItem>
          <SelectItem value="woocommerce">
            <div className="flex items-center gap-2">
              <SourceIcon source="woocommerce" className="w-4 h-4" />
              WooCommerce
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            {dateFrom ? format(dateFrom, 'dd.MM.yyyy', { locale: bg }) : 'От дата'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dateFrom}
            onSelect={onDateFromChange}
            initialFocus
            locale={bg}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            {dateTo ? format(dateTo, 'dd.MM.yyyy', { locale: bg }) : 'До дата'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={dateTo}
            onSelect={onDateToChange}
            initialFocus
            locale={bg}
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" onClick={onClearFilters} className="text-muted-foreground">
          <X className="w-4 h-4 mr-2" />
          Изчисти
        </Button>
      )}
    </div>
  );
};
