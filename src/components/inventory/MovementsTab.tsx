import { FC, useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { MOVEMENT_TYPE_LABELS, MovementType } from '@/types/inventory';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, History, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface MovementsTabProps {
  inventory: ReturnType<typeof useInventory>;
}

export const MovementsTab: FC<MovementsTabProps> = ({ inventory }) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSku(text);
    setTimeout(() => setCopiedSku(null), 2000);
    toast.success('Код копиран!');
  };

  const filteredMovements = inventory.movements.filter(m => {
    const matchesSearch = 
      m.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.reason?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getMovementIcon = (type: MovementType) => {
    switch (type) {
      case 'in':
        return <ArrowDownToLine className="w-4 h-4 text-success" />;
      case 'out':
        return <ArrowUpFromLine className="w-4 h-4 text-destructive" />;
      case 'adjustment':
        return <RefreshCw className="w-4 h-4 text-info" />;
      case 'return':
        return <ArrowDownToLine className="w-4 h-4 text-warning" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-success text-success-foreground">{MOVEMENT_TYPE_LABELS[type]}</Badge>;
      case 'out':
        return <Badge className="bg-destructive text-destructive-foreground">{MOVEMENT_TYPE_LABELS[type]}</Badge>;
      case 'adjustment':
        return <Badge className="bg-info text-info-foreground">{MOVEMENT_TYPE_LABELS[type]}</Badge>;
      case 'return':
        return <Badge className="bg-warning text-warning-foreground">{MOVEMENT_TYPE_LABELS[type]}</Badge>;
      default:
        return <Badge>{MOVEMENT_TYPE_LABELS[type]}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси по артикул или причина..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Тип движение" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички типове</SelectItem>
            <SelectItem value="in" className="text-green-500 focus:text-green-500">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Приход
              </div>
            </SelectItem>
            <SelectItem value="out" className="text-red-500 focus:text-red-500">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4" />
                Разход
              </div>
            </SelectItem>
            <SelectItem value="adjustment" className="text-blue-500 focus:text-blue-500">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Корекция
              </div>
            </SelectItem>
            <SelectItem value="return" className="text-orange-500 focus:text-orange-500">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Връщане
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movements - Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredMovements.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Няма записани движения</p>
              </CardContent>
            </Card>
          ) : (
            filteredMovements.map((movement) => (
              <Card key={movement.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movement_type)}
                      {getMovementBadge(movement.movement_type)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="font-medium">{movement.product?.name || 'Неизвестен'}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">{movement.product?.sku}</span>
                      {movement.product?.sku && (
                        <button
                          onClick={() => copyToClipboard(movement.product!.sku)}
                          className="p-0.5 hover:bg-muted rounded transition-colors"
                          title="Копирай код"
                        >
                          {copiedSku === movement.product?.sku ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Количество</p>
                      <p className={`font-medium ${
                        movement.movement_type === 'in' || movement.movement_type === 'return' 
                          ? 'text-success' 
                          : movement.movement_type === 'out' 
                            ? 'text-destructive' 
                            : ''
                      }`}>
                        {movement.movement_type === 'in' || movement.movement_type === 'return' ? '+' : '-'}
                        {movement.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Сума</p>
                      <p className="font-medium">{movement.total_price.toFixed(2)} €</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Наличност</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">{movement.stock_before}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{movement.stock_after}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ед. цена</p>
                      <p className="text-sm">{movement.unit_price.toFixed(2)} €</p>
                    </div>
                  </div>
                  {movement.reason && (
                    <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
                      {movement.reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* Movements Table - Desktop */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата/Час</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Артикул</TableHead>
                    <TableHead className="text-right">Количество</TableHead>
                    <TableHead className="text-right">Преди</TableHead>
                    <TableHead className="text-right">След</TableHead>
                    <TableHead className="text-right">Ед. цена</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead>Причина</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Няма записани движения</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{format(new Date(movement.created_at), 'dd.MM.yyyy', { locale: bg })}</span>
                            <span className="text-muted-foreground text-xs">
                              {format(new Date(movement.created_at), 'HH:mm:ss', { locale: bg })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(movement.movement_type)}
                            {getMovementBadge(movement.movement_type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{movement.product?.name || 'Неизвестен'}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{movement.product?.sku}</span>
                              {movement.product?.sku && (
                                <button
                                  onClick={() => copyToClipboard(movement.product!.sku)}
                                  className="p-0.5 hover:bg-muted rounded transition-colors"
                                  title="Копирай код"
                                >
                                  {copiedSku === movement.product?.sku ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-muted-foreground hover:text-primary" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={
                            movement.movement_type === 'in' || movement.movement_type === 'return' 
                              ? 'text-success' 
                              : movement.movement_type === 'out' 
                                ? 'text-destructive' 
                                : ''
                          }>
                            {movement.movement_type === 'in' || movement.movement_type === 'return' ? '+' : '-'}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {movement.stock_before}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movement.stock_after}
                        </TableCell>
                        <TableCell className="text-right">
                          {movement.unit_price.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movement.total_price.toFixed(2)} €
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
                          {movement.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
