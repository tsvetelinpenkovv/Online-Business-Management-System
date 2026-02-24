import { FC, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Package } from 'lucide-react';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)',
  'hsl(263, 70%, 60%)', 'hsl(172, 66%, 40%)', 'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)', 'hsl(340, 82%, 52%)',
];

interface Props {
  orders: any[];
}

export const SalesByProductChart: FC<Props> = ({ orders }) => {
  const productData = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; quantity: number; orders: number }>();
    orders.forEach(o => {
      const name = o.product_name || 'Неизвестен';
      const existing = map.get(name) || { name, revenue: 0, quantity: 0, orders: 0 };
      existing.revenue += Number(o.total_price);
      existing.quantity += Number(o.quantity);
      existing.orders += 1;
      map.set(name, existing);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const top10 = productData.slice(0, 10);
  const chartConfig = { revenue: { label: 'Приходи', color: 'hsl(221, 83%, 53%)' } };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4" /> Топ 10 продукта по приходи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={top10} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" className="text-xs" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} name="Приходи (€)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Всички продукти ({productData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead className="text-right">Поръчки</TableHead>
                <TableHead className="text-right">Количество</TableHead>
                <TableHead className="text-right">Приходи</TableHead>
                <TableHead className="text-right">% от общо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Няма данни</TableCell></TableRow>
              ) : productData.slice(0, 25).map((p, i) => {
                const totalRev = productData.reduce((s, x) => s + x.revenue, 0);
                const pct = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0;
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell className="max-w-[300px] truncate font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.orders}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{p.revenue.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="text-xs">{pct.toFixed(1)}%</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
