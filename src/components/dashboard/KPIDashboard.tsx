import { FC, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, Euro, TrendingUp, TrendingDown, 
  AlertTriangle, Package, Loader2, Minus
} from 'lucide-react';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface KPIData {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  pendingOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const KPIDashboard: FC = () => {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true);
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();
        const yesterdayStart = startOfDay(subDays(new Date(), 1)).toISOString();
        const yesterdayEnd = endOfDay(subDays(new Date(), 1)).toISOString();

        const [todayRes, yesterdayRes, pendingRes, stockRes] = await Promise.all([
          supabase.from('orders').select('total_price').gte('created_at', todayStart).lte('created_at', todayEnd),
          supabase.from('orders').select('total_price').gte('created_at', yesterdayStart).lte('created_at', yesterdayEnd),
          supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['Нова', 'В обработка']),
          supabase.from('inventory_products').select('current_stock, min_stock_level').eq('is_active', true),
        ]);

        const todayOrders = todayRes.data || [];
        const yesterdayOrders = yesterdayRes.data || [];
        const allProducts = stockRes.data || [];
        const lowStockCount = allProducts.filter(p => p.current_stock > 0 && p.current_stock <= (p.min_stock_level || 0)).length;
        const outOfStockCount = allProducts.filter(p => p.current_stock <= 0).length;

        setData({
          todayRevenue: todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
          yesterdayRevenue: yesterdayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
          todayOrders: todayOrders.length,
          yesterdayOrders: yesterdayOrders.length,
          pendingOrders: pendingRes.count || 0,
          lowStockCount,
          outOfStockCount,
        });
      } catch (err) {
        console.error('Error fetching KPIs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-20 mb-2" />
              <div className="h-7 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const revenueChange = data.yesterdayRevenue > 0
    ? ((data.todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue * 100)
    : 0;
  const ordersChange = data.yesterdayOrders > 0
    ? ((data.todayOrders - data.yesterdayOrders) / data.yesterdayOrders * 100)
    : 0;

  const TrendIcon: FC<{ value: number; className?: string }> = ({ value, className }) => {
    if (value > 0) return <TrendingUp className={className} />;
    if (value < 0) return <TrendingDown className={className} />;
    return <Minus className={className} />;
  };

  const trendColor = (value: number) =>
    value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {/* Today's Revenue */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Приходи днес</span>
            <Euro className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{data.todayRevenue.toFixed(2)} €</p>
          {data.yesterdayRevenue > 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor(revenueChange)}`}>
              <TrendIcon value={revenueChange} className="w-3 h-3" />
              <span>{Math.abs(Math.round(revenueChange))}% спрямо вчера</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Orders */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Поръчки днес</span>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{data.todayOrders}</p>
          {data.yesterdayOrders > 0 && (
            <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor(ordersChange)}`}>
              <TrendIcon value={ordersChange} className="w-3 h-3" />
              <span>{Math.abs(Math.round(ordersChange))}% спрямо вчера</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Orders */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Чакащи поръчки</span>
            <Package className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xl font-bold">{data.pendingOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">Нова + В обработка</p>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Сток аларми</span>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold">{data.lowStockCount + data.outOfStockCount}</p>
          </div>
          <div className="flex gap-2 mt-1">
            {data.lowStockCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-warning/20 text-warning pointer-events-none">
                {data.lowStockCount} ниска
              </Badge>
            )}
            {data.outOfStockCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive pointer-events-none">
                {data.outOfStockCount} изчерпан
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
