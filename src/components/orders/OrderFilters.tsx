import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, X, Globe, BarChart3, Warehouse, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ORDER_STATUSES } from '@/types/order';
import { StatusBadge } from './StatusBadge';
import { SourceIcon } from '@/components/icons/SourceIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onToggleStatistics?: () => void;
  showStatistics?: boolean;
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
  onToggleStatistics,
  showStatistics,
}) => {
  const navigate = useNavigate();
  const hasFilters = searchTerm || statusFilter !== 'all' || sourceFilter !== 'all' || dateFrom || dateTo;

  const getStatusLabel = () => {
    if (statusFilter === 'all') return 'Статуси';
    return statusFilter;
  };

  const getSourceLabel = () => {
    if (sourceFilter === 'all') return 'Източници';
    const sourceLabels: Record<string, string> = {
      google: 'Google',
      facebook: 'Facebook',
      woocommerce: 'WooCommerce',
      phone: 'Телефон',
    };
    return sourceLabels[sourceFilter] || sourceFilter;
  };

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-card rounded-lg border">
      {/* Desktop: all in one row */}
      <div className="hidden lg:flex items-center gap-3">
        {onToggleStatistics && (
          <Button 
            variant={showStatistics ? "default" : "outline"} 
            size="icon"
            onClick={onToggleStatistics}
            title="Статистика"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        )}
        <div className="relative w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси клиент, телефон, ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{getStatusLabel()}</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onClick={() => onStatusFilterChange('all')}>
              Всички статуси
            </DropdownMenuItem>
            {ORDER_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onClick={() => onStatusFilterChange(status)}>
                <StatusBadge status={status} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[160px] justify-between">
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{getSourceLabel()}</span>
              </div>
              <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem onClick={() => onSourceFilterChange('all')}>
              Всички източници
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSourceFilterChange('google')}>
              <SourceIcon source="google" className="w-4 h-4 mr-2" />
              Google
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSourceFilterChange('facebook')}>
              <SourceIcon source="facebook" className="w-4 h-4 mr-2" />
              Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSourceFilterChange('woocommerce')}>
              <SourceIcon source="woocommerce" className="w-4 h-4 mr-2" />
              WooCommerce
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSourceFilterChange('phone')}>
              <SourceIcon source="phone" className="w-4 h-4 mr-2" />
              Телефон
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{dateFrom ? format(dateFrom, 'dd.MM.yy', { locale: bg }) : 'От дата'}</span>
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
            <Button variant="outline" className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{dateTo ? format(dateTo, 'dd.MM.yy', { locale: bg }) : 'До дата'}</span>
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

        <Button 
          variant="outline" 
          onClick={() => navigate('/inventory')}
          className="bg-primary/10 hover:bg-primary/20 border-primary/30 text-foreground hover:text-foreground dark:hover:text-primary-foreground"
        >
          <Warehouse className="w-4 h-4 mr-2" />
          Склад
        </Button>

        {hasFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-2" />
            Изчисти
          </Button>
        )}
      </div>

      {/* Mobile/Tablet: stacked layout */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center gap-2">
          {onToggleStatistics && (
            <Button 
              variant={showStatistics ? "default" : "outline"} 
              size="icon"
              onClick={onToggleStatistics}
              title="Статистика"
              className="flex-shrink-0"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Търсене по клиент, телефон, ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[180px] h-10">
                <div className="flex items-center justify-center w-full">
                  <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 text-center">{getStatusLabel()}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 opacity-50" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem onClick={() => onStatusFilterChange('all')}>
                Всички статуси
              </DropdownMenuItem>
              {ORDER_STATUSES.map((status) => (
                <DropdownMenuItem key={status} onClick={() => onStatusFilterChange(status)}>
                  <StatusBadge status={status} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[180px] h-10">
                <div className="flex items-center justify-center w-full">
                  <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="flex-1 text-center">{getSourceLabel()}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0 opacity-50" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuItem onClick={() => onSourceFilterChange('all')}>
                Всички източници
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSourceFilterChange('google')}>
                <SourceIcon source="google" className="w-4 h-4 mr-2" />
                Google
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSourceFilterChange('facebook')}>
                <SourceIcon source="facebook" className="w-4 h-4 mr-2" />
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSourceFilterChange('woocommerce')}>
                <SourceIcon source="woocommerce" className="w-4 h-4 mr-2" />
                WooCommerce
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSourceFilterChange('phone')}>
                <SourceIcon source="phone" className="w-4 h-4 mr-2" />
                Телефон
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none sm:min-w-[140px] h-10 text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{dateFrom ? format(dateFrom, 'dd.MM.yy', { locale: bg }) : 'От дата'}</span>
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
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none sm:min-w-[140px] h-10 text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{dateTo ? format(dateTo, 'dd.MM.yy', { locale: bg }) : 'До дата'}</span>
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
          </div>

          {/* Warehouse button for mobile */}
          <Button 
            variant="outline" 
            onClick={() => navigate('/inventory')}
            className="w-full sm:w-auto bg-primary/10 hover:bg-primary/20 border-primary/30 text-foreground hover:text-foreground dark:hover:text-primary-foreground"
          >
            <Warehouse className="w-4 h-4 mr-2" />
            Склад
          </Button>

          {hasFilters && (
            <Button variant="ghost" onClick={onClearFilters} className="text-muted-foreground w-full sm:w-auto">
              <X className="w-4 h-4 mr-2" />
              Изчисти
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};