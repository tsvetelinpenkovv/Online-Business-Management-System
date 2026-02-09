import { FC, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Warehouse, Package, AlertTriangle, TrendingUp, 
  MapPin, Boxes, ArrowRightLeft, BarChart3 
} from 'lucide-react';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useInventory } from '@/hooks/useInventory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface StockByWarehouse {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  total_products: number;
  total_stock: number;
  total_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--accent))'];

export const WarehouseDashboard: FC = () => {
  const isMobile = useIsMobile();
  const { warehouses, multiWarehouseEnabled, loading: warehouseLoading } = useWarehouses();
  const inventory = useInventory();

  // Calculate stats per warehouse (simulated for single warehouse mode)
  const warehouseStats = useMemo<StockByWarehouse[]>(() => {
    if (!multiWarehouseEnabled || warehouses.length === 0) {
      // Single warehouse mode - show all inventory as one warehouse
      const stats = inventory.getInventoryStats();
      return [{
        warehouse_id: 'default',
        warehouse_name: 'Основен склад',
        warehouse_code: 'MAIN',
        total_products: stats.totalProducts,
        total_stock: inventory.products.reduce((sum, p) => sum + p.current_stock, 0),
        total_value: stats.totalStockValue,
        low_stock_count: stats.lowStockProducts,
        out_of_stock_count: stats.outOfStockProducts,
      }];
    }

    // Multi-warehouse mode - calculate per warehouse
    return warehouses.filter(w => w.is_active).map(warehouse => {
      // In a real implementation, this would query stock_by_warehouse table
      // For now, distribute products across warehouses as simulation
      const totalProducts = Math.ceil(inventory.products.length / warehouses.length);
      const totalStock = Math.ceil(inventory.products.reduce((sum, p) => sum + p.current_stock, 0) / warehouses.length);
      const totalValue = inventory.getInventoryStats().totalStockValue / warehouses.length;
      
      return {
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        warehouse_code: warehouse.code,
        total_products: totalProducts,
        total_stock: totalStock,
        total_value: totalValue,
        low_stock_count: Math.ceil(inventory.getInventoryStats().lowStockProducts / warehouses.length),
        out_of_stock_count: Math.ceil(inventory.getInventoryStats().outOfStockProducts / warehouses.length),
      };
    });
  }, [warehouses, multiWarehouseEnabled, inventory]);

  // Data for bar chart - stock distribution
  const stockDistributionData = useMemo(() => {
    return warehouseStats.map(stat => ({
      name: stat.warehouse_code,
      stock: stat.total_stock,
      value: Math.round(stat.total_value),
    }));
  }, [warehouseStats]);

  // Data for pie chart - value distribution
  const valueDistributionData = useMemo(() => {
    return warehouseStats.map(stat => ({
      name: stat.warehouse_name,
      value: Math.round(stat.total_value),
    }));
  }, [warehouseStats]);

  // Total stats
  const totals = useMemo(() => {
    return {
      totalStock: warehouseStats.reduce((sum, s) => sum + s.total_stock, 0),
      totalValue: warehouseStats.reduce((sum, s) => sum + s.total_value, 0),
      totalLowStock: warehouseStats.reduce((sum, s) => sum + s.low_stock_count, 0),
      totalOutOfStock: warehouseStats.reduce((sum, s) => sum + s.out_of_stock_count, 0),
    };
  }, [warehouseStats]);

  if (warehouseLoading || inventory.loading) {
    return <div className="flex items-center justify-center p-8">Зареждане...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Warehouse className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Складове</p>
                <p className="text-2xl font-bold">{warehouseStats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Boxes className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Обща наличност</p>
                <p className="text-2xl font-bold">{totals.totalStock.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Обща стойност</p>
                <p className="text-2xl font-bold">{totals.totalValue.toFixed(0)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ниска наличност</p>
                <p className="text-2xl font-bold text-warning">{totals.totalLowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
        {/* Stock Distribution Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Наличност по складове
            </CardTitle>
            <CardDescription>Разпределение на количествата</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toLocaleString() + ' бр.', 'Наличност']}
                  />
                  <Bar 
                    dataKey="stock" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Value Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4" />
              Стойност по складове
            </CardTitle>
            <CardDescription>Разпределение на стойността</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valueDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 60}
                    outerRadius={isMobile ? 65 : 80}
                    paddingAngle={5}
                    dataKey="value"
                    label={isMobile ? false : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={!isMobile}
                  >
                    {valueDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} €`, 'Стойност']}
                  />
                  {isMobile && <Legend verticalAlign="bottom" height={36} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Details Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Детайли по складове
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
            {warehouseStats.map((stat, index) => {
              const stockPercent = totals.totalStock > 0 
                ? (stat.total_stock / totals.totalStock) * 100 
                : 0;
              const healthScore = stat.total_products > 0 
                ? ((stat.total_products - stat.low_stock_count - stat.out_of_stock_count) / stat.total_products) * 100 
                : 100;

              return (
                <Card key={stat.warehouse_id} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{stat.warehouse_name}</span>
                      </div>
                      <Badge variant="outline">{stat.warehouse_code}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Артикули</span>
                        <span className="font-medium">{stat.total_products}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Наличност</span>
                        <span className="font-medium">{stat.total_stock.toLocaleString()} бр.</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Дял от общата</span>
                          <span className="font-medium">{stockPercent.toFixed(1)}%</span>
                        </div>
                        <Progress value={stockPercent} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Стойност</span>
                        <span className="font-medium text-success">{stat.total_value.toFixed(2)} €</span>
                      </div>

                      <div className="flex gap-2">
                        {stat.low_stock_count > 0 && (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                            {stat.low_stock_count} ниска
                          </Badge>
                        )}
                        {stat.out_of_stock_count > 0 && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            {stat.out_of_stock_count} изчерпани
                          </Badge>
                        )}
                        {stat.low_stock_count === 0 && stat.out_of_stock_count === 0 && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            Оптимално
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Activity */}
      {multiWarehouseEnabled && warehouses.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Последни трансфери
            </CardTitle>
            <CardDescription>
              Движения между складове
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Няма регистрирани трансфери</p>
              <p className="text-sm">Трансферите между складове ще се показват тук</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
