import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCourierApi } from '@/hooks/useCourierApi';
import { useCouriers } from '@/hooks/useCouriers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileBox,
  Search,
  Download,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  MapPin,
  Package,
  Truck,
  ExternalLink,
  XCircle,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface Shipment {
  id: string;
  waybill_number: string;
  courier_id: string;
  order_id: number | null;
  status: string | null;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string | null;
  recipient_address: string | null;
  recipient_office_code: string | null;
  delivery_type: string | null;
  cod_amount: number | null;
  weight: number | null;
  created_at: string;
  courier?: {
    id: string;
    name: string;
    logo_url: string | null;
    url_pattern: string | null;
  };
}

interface TrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment | null;
}

const TrackingDialog = ({ open, onOpenChange, shipment }: TrackingDialogProps) => {
  const { trackShipment } = useCourierApi();
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<{
    status?: string;
    events?: Array<{ date: string; status: string; location?: string; description?: string }>;
    delivered?: boolean;
  } | null>(null);

  useEffect(() => {
    if (open && shipment) {
      loadTracking();
    }
  }, [open, shipment]);

  const loadTracking = async () => {
    if (!shipment?.courier) return;
    setLoading(true);
    try {
      const result = await trackShipment(
        shipment.courier_id,
        shipment.courier.name,
        shipment.waybill_number
      );
      if (result.success) {
        setTrackingData({
          status: result.status,
          events: result.events,
          delivered: result.delivered,
        });
      }
    } catch (err) {
      console.error('Error loading tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Проследяване: {shipment?.waybill_number}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : trackingData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={trackingData.delivered ? 'default' : 'secondary'}>
                {trackingData.status || 'В обработка'}
              </Badge>
              {trackingData.delivered && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Доставено
                </Badge>
              )}
            </div>

            {trackingData.events && trackingData.events.length > 0 && (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {trackingData.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 pb-3 border-b last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.status}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{event.date}</span>
                          {event.location && (
                            <>
                              <span>•</span>
                              <span>{event.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Няма информация за проследяване
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const ShipmentsTab = () => {
  const { toast } = useToast();
  const { couriers } = useCouriers();
  const { getLabel, cancelShipment, loading: apiLoading } = useCourierApi();
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null);
  const [trackingShipment, setTrackingShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          courier:couriers(id, name, logo_url, url_pattern)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setShipments((data || []) as Shipment[]);
    } catch (err) {
      console.error('Error fetching shipments:', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на товарителници',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLabel = async (shipment: Shipment) => {
    if (!shipment.courier) return;
    
    setDownloadingLabel(shipment.id);
    try {
      const result = await getLabel(
        shipment.courier_id,
        shipment.courier.name,
        shipment.waybill_number
      );

      if (result.success && result.labelUrl) {
        // If it's a base64 PDF, create download link
        if (result.labelUrl.startsWith('JVB') || result.labelUrl.length > 100) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${result.labelUrl}`;
          link.download = `label-${shipment.waybill_number}.pdf`;
          link.click();
        } else {
          // Direct URL
          window.open(result.labelUrl, '_blank');
        }
        toast({ title: 'Успех', description: 'Етикетът е изтеглен' });
      } else {
        toast({
          title: 'Грешка',
          description: result.error || 'Неуспешно изтегляне на етикет',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error downloading label:', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтегляне на етикет',
        variant: 'destructive',
      });
    } finally {
      setDownloadingLabel(null);
    }
  };

  const handleCancelShipment = async (shipment: Shipment) => {
    if (!shipment.courier) return;
    
    if (!confirm(`Сигурни ли сте, че искате да анулирате товарителница ${shipment.waybill_number}?`)) {
      return;
    }

    try {
      const result = await cancelShipment(
        shipment.courier_id,
        shipment.courier.name,
        shipment.waybill_number
      );

      if (result.success) {
        toast({ title: 'Успех', description: 'Товарителницата е анулирана' });
        // Update local state
        setShipments(prev => 
          prev.map(s => s.id === shipment.id ? { ...s, status: 'cancelled' } : s)
        );
        // Update in database
        await supabase
          .from('shipments')
          .update({ status: 'cancelled' })
          .eq('id', shipment.id);
      } else {
        toast({
          title: 'Грешка',
          description: result.error || 'Неуспешно анулиране',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error canceling shipment:', err);
    }
  };

  const getTrackingUrl = (shipment: Shipment): string | null => {
    if (!shipment.courier?.url_pattern) return null;
    return shipment.courier.url_pattern.replace('{tracking}', shipment.waybill_number);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'created':
        return <Badge variant="secondary">Създадена</Badge>;
      case 'shipped':
        return <Badge variant="default">Изпратена</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Доставена</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Анулирана</Badge>;
      default:
        return <Badge variant="outline">{status || 'Неизвестен'}</Badge>;
    }
  };

  const filteredShipments = shipments.filter(s => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.waybill_number.toLowerCase().includes(search) ||
      s.recipient_name.toLowerCase().includes(search) ||
      s.recipient_phone.includes(search) ||
      (s.order_id && s.order_id.toString().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Търси по номер, получател, телефон..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchShipments} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обнови
        </Button>
      </div>

      {filteredShipments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBox className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Няма намерени товарителници' : 'Все още няма създадени товарителници'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товарителница</TableHead>
                <TableHead>Куриер</TableHead>
                <TableHead>Получател</TableHead>
                <TableHead>Доставка</TableHead>
                <TableHead>Наложен платеж</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const trackingUrl = getTrackingUrl(shipment);
                
                return (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <div className="font-medium">{shipment.waybill_number}</div>
                      {shipment.order_id && (
                        <div className="text-xs text-muted-foreground">
                          Поръчка #{shipment.order_id}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {shipment.courier ? (
                        <div className="flex items-center gap-2">
                          {shipment.courier.logo_url ? (
                            <img
                              src={shipment.courier.logo_url}
                              alt={shipment.courier.name}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )}
                          <span className="text-sm">{shipment.courier.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{shipment.recipient_name}</div>
                      <div className="text-xs text-muted-foreground">{shipment.recipient_phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {shipment.delivery_type === 'office' ? (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>Офис</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3" />
                            <span>Адрес</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {shipment.recipient_city}
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.cod_amount ? (
                        <span className="font-medium">{shipment.cod_amount.toFixed(2)} лв</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {format(new Date(shipment.created_at), 'dd.MM.yyyy', { locale: bg })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDownloadLabel(shipment)}
                            disabled={downloadingLabel === shipment.id}
                          >
                            {downloadingLabel === shipment.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Изтегли етикет
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTrackingShipment(shipment)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Проследяване
                          </DropdownMenuItem>
                          {trackingUrl && (
                            <DropdownMenuItem onClick={() => window.open(trackingUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Отвори в сайта
                            </DropdownMenuItem>
                          )}
                          {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
                            <DropdownMenuItem
                              onClick={() => handleCancelShipment(shipment)}
                              className="text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Анулирай
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TrackingDialog
        open={!!trackingShipment}
        onOpenChange={(open) => !open && setTrackingShipment(null)}
        shipment={trackingShipment}
      />
    </div>
  );
};
