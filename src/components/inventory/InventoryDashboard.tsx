import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, AlertTriangle, XCircle, TrendingUp, 
  Warehouse, ArrowUpRight, ArrowDownRight, Lock, Unlock, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MOVEMENT_TYPE_LABELS, StockMovement } from '@/types/inventory';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  totalSaleValue: number;
  totalReserved: number;
  totalCurrent: number;
  productsWithReservations: number;
  suppliersCount: number;
}

export const InventoryDashboard: FC = () => {
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [statsRes, movementsRes] = await Promise.all([
        supabase.rpc('get_inventory_stats'),
        supabase
          .from('stock_movements')
          .select('*, product:inventory_products(id, name, sku)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (statsRes.data) {
        setStats(statsRes.data as unknown as InventoryStats);
      }
      if (movementsRes.data) {
        setRecentMovements(movementsRes.data as unknown as StockMovement[]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const potentialProfit = stats.totalSaleValue - stats.totalStockValue;
  const totalAvailable = stats.totalCurrent - stats.totalReserved;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Общо артикули</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ниска наличност</p>
                <p className="text-2xl font-bold text-warning">{stats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Изчерпани</p>
                <p className="text-2xl font-bold text-destructive">{stats.outOfStockProducts}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Стойност на склада</p>
                <p className="text-2xl font-bold text-success">{Number(stats.totalStockValue).toFixed(2)} €</p>
              </div>
              <Warehouse className="w-8 h-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Свободна наличност</p>
                <p className="text-2xl font-bold text-primary">{totalAvailable.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">от {Number(stats.totalCurrent).toFixed(0)} общо</p>
              </div>
              <Unlock className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Резервирано</p>
                <p className="text-2xl font-bold text-amber-600">{Number(stats.totalReserved).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{stats.productsWithReservations} артикула</p>
              </div>
              <Lock className="w-8 h-8 text-amber-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Потенциална печалба</p>
                <p className="text-2xl font-bold text-success">{potentialProfit.toFixed(2)} €</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Доставчици</p>
                <p className="text-2xl font-bold">{stats.suppliersCount}</p>
              </div>
              <Package className="w-8 h-8 text-info opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Последни движения
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="text-muted-foreground text-sm">Няма записани движения</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentMovements.map(movement => (
                <div key={movement.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {movement.movement_type === 'in' || movement.movement_type === 'return' ? (
                      <ArrowDownRight className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{movement.product?.name || 'Неизвестен продукт'}</p>
                      <p className="text-xs text-muted-foreground">
                        {MOVEMENT_TYPE_LABELS[movement.movement_type]} • {movement.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at), 'dd.MM.yyyy', { locale: bg })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at), 'HH:mm', { locale: bg })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
