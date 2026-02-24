import { FC, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

const COLORS = [
  'hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)',
  'hsl(263, 70%, 60%)', 'hsl(172, 66%, 40%)', 'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)', 'hsl(340, 82%, 52%)', 'hsl(28, 80%, 52%)', 'hsl(300, 50%, 50%)',
];

interface Props {
  orders: any[];
}

// Extract city from delivery address (simple heuristic)
const extractCity = (address: string | null): string => {
  if (!address) return 'Неизвестен';
  // Try common patterns: "гр. София", "София", or city after last comma
  const grMatch = address.match(/гр\.?\s*([^,]+)/i);
  if (grMatch) return grMatch[1].trim();
  
  const parts = address.split(',').map(s => s.trim());
  // Usually city is first or last part
  if (parts.length >= 2) return parts[parts.length - 1] || parts[0];
  return parts[0] || 'Неизвестен';
};

export const SalesByRegionChart: FC<Props> = ({ orders }) => {
  const regionData = useMemo(() => {
    const map = new Map<string, { city: string; revenue: number; orders: number }>();
    orders.forEach(o => {
      const city = extractCity(o.delivery_address);
      const existing = map.get(city) || { city, revenue: 0, orders: 0 };
      existing.revenue += Number(o.total_price);
      existing.orders += 1;
      map.set(city, existing);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const top10 = regionData.slice(0, 10);
  const pieData = top10.map(r => ({ name: r.city, value: r.orders }));
  const chartConfig = { revenue: { label: 'Приходи', color: 'hsl(221, 83%, 53%)' } };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Приходи по градове (Топ 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={top10} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 11 }} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} name="Приходи (€)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Поръчки по градове</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Всички градове ({regionData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Град</TableHead>
                <TableHead className="text-right">Поръчки</TableHead>
                <TableHead className="text-right">Приходи</TableHead>
                <TableHead className="text-right">Ср. стойност</TableHead>
                <TableHead className="text-right">% от общо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Няма данни</TableCell></TableRow>
              ) : regionData.slice(0, 30).map((r, i) => {
                const totalRev = regionData.reduce((s, x) => s + x.revenue, 0);
                const pct = totalRev > 0 ? (r.revenue / totalRev) * 100 : 0;
                return (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{r.city}</TableCell>
                    <TableCell className="text-right">{r.orders}</TableCell>
                    <TableCell className="text-right font-medium">{r.revenue.toFixed(2)} €</TableCell>
                    <TableCell className="text-right">{(r.revenue / r.orders).toFixed(2)} €</TableCell>
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
