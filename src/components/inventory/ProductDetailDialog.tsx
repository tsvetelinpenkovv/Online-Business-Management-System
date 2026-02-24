import { FC, useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { InventoryProduct } from '@/types/inventory';
import { Package, TrendingUp, TrendingDown, Minus, Calendar, Truck, Globe, BarChart3, Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { bg } from 'date-fns/locale';

interface ProductDetailDialogProps {
  product: InventoryProduct | null;
  onClose: () => void;
}

interface OrderStats {
  fulfilled: number;
  delivered: number;
  returned: number;
  cancelled: number;
  unprocessed: number;
  pending: number;
  confirmed: number;
  noAnswer: number;
}

interface CourierOption {
  id: string;
  name: string;
}

export const ProductDetailDialog: FC<ProductDetailDialogProps> = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    fulfilled: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    unprocessed: 0,
    pending: 0,
    confirmed: 0,
    noAnswer: 0,
  });
  const [dateRange, setDateRange] = useState('30');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCourier, setSelectedCourier] = useState<string>('all');
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [previousStats, setPreviousStats] = useState<OrderStats | null>(null);

  // Fetch couriers
  useEffect(() => {
    const fetchCouriers = async () => {
      const { data } = await supabase.from('couriers').select('id, name').order('name');
      if (data) setCouriers(data);
    };
    fetchCouriers();
  }, []);

  // Fetch product stats when product or filters change
  useEffect(() => {
    if (!product) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const days = parseInt(dateRange);
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(new Date(), days));
        const prevStartDate = startOfDay(subDays(new Date(), days * 2));
        const prevEndDate = startOfDay(subDays(new Date(), days));

        // Build query for current period
        let query = supabase
          .from('orders')
          .select('status, courier_id, source')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        // Filter by product name or catalog number
        if (product.sku) {
          query = query.or(`catalog_number.ilike.%${product.sku}%,product_name.ilike.%${product.name}%`);
        } else {
          query = query.ilike('product_name', `%${product.name}%`);
        }

        // Apply filters
        if (selectedSource !== 'all') {
          query = query.eq('source', selectedSource);
        }
        if (selectedCourier !== 'all') {
          query = query.eq('courier_id', selectedCourier);
        }

        const { data: currentOrders } = await query;

        // Build query for previous period
        let prevQuery = supabase
          .from('orders')
          .select('status')
          .gte('created_at', prevStartDate.toISOString())
          .lte('created_at', prevEndDate.toISOString());

        if (product.sku) {
          prevQuery = prevQuery.or(`catalog_number.ilike.%${product.sku}%,product_name.ilike.%${product.name}%`);
        } else {
          prevQuery = prevQuery.ilike('product_name', `%${product.name}%`);
        }

        if (selectedSource !== 'all') {
          prevQuery = prevQuery.eq('source', selectedSource);
        }
        if (selectedCourier !== 'all') {
          prevQuery = prevQuery.eq('courier_id', selectedCourier);
        }

        const { data: prevOrders } = await prevQuery;

        // Calculate stats
        const calculateStats = (orders: any[]): OrderStats => {
          const result: OrderStats = {
            fulfilled: 0,
            delivered: 0,
            returned: 0,
            cancelled: 0,
            unprocessed: 0,
            pending: 0,
            confirmed: 0,
            noAnswer: 0,
          };

          orders?.forEach(order => {
            switch (order.status) {
              case 'Завършена':
                result.fulfilled++;
                break;
              case 'Доставена':
                result.delivered++;
                break;
              case 'Върната':
                result.returned++;
                break;
              case 'Отказана':
              case 'Анулирана':
                result.cancelled++;
                break;
              case 'Нова':
                result.unprocessed++;
                break;
              case 'В обработка':
              case 'Изпратена':
                result.pending++;
                break;
              case 'Потвърдена':
              case 'Платена с карта':
              case 'На лизинг през TBI':
              case 'На лизинг през BNP':
              case 'На лизинг през UniCredit':
                result.confirmed++;
                break;
              case 'Неуспешна връзка':
              case 'Неуспешна доставка':
                result.noAnswer++;
                break;
            }
          });

          return result;
        };

        setStats(calculateStats(currentOrders || []));
        setPreviousStats(calculateStats(prevOrders || []));

        // Try to load images from product_images table first
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('thumbnail_url, cached_url, original_url')
          .eq('product_id', product.id)
          .order('position', { ascending: true });

        if (imagesData && imagesData.length > 0) {
          const urls = imagesData.map(img => img.cached_url || img.original_url);
          setProductImages(urls);
          setProductImage(imagesData[0].thumbnail_url || imagesData[0].cached_url || imagesData[0].original_url);
          setActiveImageIdx(0);
        } else if (product.woocommerce_id) {
          // Fallback: fetch from WooCommerce API
          try {
            const { data: platformData } = await supabase
              .from('ecommerce_platforms')
              .select('config')
              .eq('name', 'woocommerce')
              .maybeSingle();
            
            if (platformData?.config) {
              const config = platformData.config as { store_url?: string; consumer_key?: string; consumer_secret?: string };
              if (config.store_url && config.consumer_key && config.consumer_secret) {
                const baseUrl = config.store_url.replace(/\/$/, '');
                const productUrl = `${baseUrl}/wp-json/wc/v3/products/${product.woocommerce_id}?consumer_key=${config.consumer_key}&consumer_secret=${config.consumer_secret}`;
                
                const response = await fetch(productUrl);
                if (response.ok) {
                  const productData = await response.json();
                  if (productData.images && productData.images.length > 0) {
                    const urls = productData.images.map((img: any) => img.src);
                    setProductImages(urls);
                    setProductImage(urls[0]);
                    setActiveImageIdx(0);
                  }
                }
              }
            }
          } catch (imgErr) {
            console.error('Error fetching product image:', imgErr);
          }
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [product, dateRange, selectedSource, selectedCourier]);

  const getPercentChange = (current: number, previous: number): { value: number; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) return { value: 0, trend: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(Math.round(change)),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const StatCard: FC<{ 
    label: string; 
    value: number; 
    previousValue?: number;
    colorClass?: string;
    showTrend?: boolean;
  }> = ({ label, value, previousValue, colorClass = 'text-foreground', showTrend = true }) => {
    const change = previousValue !== undefined ? getPercentChange(value, previousValue) : null;

    return (
      <Card className="bg-card">
        <CardContent className="p-4">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
          </div>
          {showTrend && change && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                change.trend === 'up' ? 'bg-success/20 text-success' : 
                change.trend === 'down' ? 'bg-destructive/20 text-destructive' : 
                'bg-muted text-muted-foreground'
              }`}>
                {change.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {change.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {change.trend === 'neutral' && <Minus className="w-3 h-3" />}
                {change.value}%
              </span>
              <span className="text-muted-foreground">Спрямо пр. период</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!product) return null;

  const totalDeliveredReturned = stats.delivered + stats.returned;
  const deliveryRate = totalDeliveredReturned > 0 ? Math.round((stats.delivered / totalDeliveredReturned) * 100) : 0;
  const returnRate = totalDeliveredReturned > 0 ? Math.round((stats.returned / totalDeliveredReturned) * 100) : 0;

  return (
    <Dialog open={!!product} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Статистика на продукт
          </DialogTitle>
        </DialogHeader>

        {/* Product Info Header */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto sm:mx-0 relative">
            {productImage ? (
              <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          {/* Thumbnail strip */}
          {productImages.length > 1 && (
            <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto sm:max-h-32">
              {productImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => { setProductImage(url); setActiveImageIdx(idx); }}
                  className={`w-8 h-8 rounded border overflow-hidden flex-shrink-0 transition-all ${
                    idx === activeImageIdx ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            {product.woocommerce_id && (
              <p className="text-xs text-muted-foreground">WooCommerce ID: {product.woocommerce_id}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <Badge variant="secondary" className={
                product.current_stock <= 0 ? 'bg-destructive/20 text-destructive' :
                product.current_stock <= product.min_stock_level ? 'bg-warning/20 text-warning' :
                'bg-success/20 text-success'
              }>
                Наличност: {product.current_stock} {product.unit?.abbreviation || 'бр.'}
              </Badge>
              <Badge variant="outline" className="text-warning border-warning/50">
                Покупна: {product.purchase_price.toFixed(2)} €
              </Badge>
              <Badge variant="outline" className="text-success border-success/50">
                Продажна: {product.sale_price.toFixed(2)} €
              </Badge>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Всички сайтове" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички сайтове</SelectItem>
              <SelectItem value="woocommerce">WooCommerce</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="prestashop">PrestaShop</SelectItem>
              <SelectItem value="opencart">OpenCart</SelectItem>
              <SelectItem value="magento">Magento</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="phone">Телефон</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCourier} onValueChange={setSelectedCourier}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Всички куриери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички куриери</SelectItem>
              {couriers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Последните 7 дни</SelectItem>
              <SelectItem value="30">Последните 30 дни</SelectItem>
              <SelectItem value="90">Последните 90 дни</SelectItem>
              <SelectItem value="365">Последната година</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">Поръчки по статуси</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard 
                label="Изпълнени" 
                value={stats.fulfilled}
                previousValue={previousStats?.fulfilled}
                colorClass="text-success"
              />
              <StatCard 
                label="Доставена" 
                value={stats.delivered}
                previousValue={previousStats?.delivered}
                colorClass="text-primary"
              />
              <StatCard 
                label="Върнати" 
                value={stats.returned}
                previousValue={previousStats?.returned}
                colorClass="text-warning"
              />
              <StatCard 
                label="Отказана" 
                value={stats.cancelled}
                previousValue={previousStats?.cancelled}
                colorClass="text-destructive"
              />
              <StatCard 
                label="Необработени" 
                value={stats.unprocessed}
                previousValue={previousStats?.unprocessed}
                showTrend={false}
              />
              <StatCard 
                label="Чакащи" 
                value={stats.pending}
                previousValue={previousStats?.pending}
                showTrend={false}
              />
              <StatCard 
                label="Потвърдени" 
                value={stats.confirmed}
                previousValue={previousStats?.confirmed}
                showTrend={false}
              />
              <StatCard 
                label="Без отговор" 
                value={stats.noAnswer}
                previousValue={previousStats?.noAnswer}
                showTrend={false}
              />
            </div>

            {/* Delivery/Return Rate */}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  deliveryRate >= 80 ? 'bg-success/20 text-success' : 
                  deliveryRate >= 50 ? 'bg-warning/20 text-warning' : 
                  'bg-destructive/20 text-destructive'
                }`}>
                  {deliveryRate}% доставени
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  returnRate <= 10 ? 'bg-success/20 text-success' : 
                  returnRate <= 25 ? 'bg-warning/20 text-warning' : 
                  'bg-destructive/20 text-destructive'
                }`}>
                  {returnRate}% върнати
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
