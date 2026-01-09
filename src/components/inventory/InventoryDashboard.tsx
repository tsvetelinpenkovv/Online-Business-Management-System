import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, AlertTriangle, XCircle, TrendingUp, 
  Euro, Warehouse, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { MOVEMENT_TYPE_LABELS } from '@/types/inventory';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface InventoryDashboardProps {
  inventory: ReturnType<typeof useInventory>;
}

export const InventoryDashboard: FC<InventoryDashboardProps> = ({ inventory }) => {
  const stats = inventory.getInventoryStats();
  const recentMovements = inventory.movements.slice(0, 10);
  const lowStockProducts = inventory.products.filter(
    p => p.current_stock <= p.min_stock_level && p.current_stock > 0
  );
  const outOfStockProducts = inventory.products.filter(p => p.current_stock <= 0);

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
                <p className="text-2xl font-bold text-success">{stats.totalStockValue.toFixed(2)} €</p>
              </div>
              <Warehouse className="w-8 h-8 text-success opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Продажна стойност</p>
                <p className="text-2xl font-bold">{stats.totalSaleValue.toFixed(2)} €</p>
              </div>
              <Euro className="w-8 h-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Потенциална печалба</p>
                <p className="text-2xl font-bold text-success">{stats.potentialProfit.toFixed(2)} €</p>
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
                <p className="text-2xl font-bold">{inventory.suppliers.length}</p>
              </div>
              <Package className="w-8 h-8 text-info opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Ниска наличност
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Няма артикули с ниска наличност</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {outOfStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">Изчерпан</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-warning/10 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-warning">{product.current_stock} / {product.min_stock_level}</p>
                      <p className="text-xs text-muted-foreground">{product.unit?.abbreviation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
    </div>
  );
};
