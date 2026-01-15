import { useState } from 'react';
import { Order } from '@/types/order';
import { useCouriers } from '@/hooks/useCouriers';
import { useCourierApi, ShipmentData } from '@/hooks/useCourierApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Truck, FileBox, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface BulkShipmentDialogProps {
  orders: Order[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface ShipmentResult {
  orderId: number;
  orderCode: string;
  success: boolean;
  waybillNumber?: string;
  error?: string;
}

interface EnabledCourier {
  id: string;
  name: string;
  logo_url: string | null;
}

export const BulkShipmentDialog = ({
  orders,
  open,
  onOpenChange,
  onComplete,
}: BulkShipmentDialogProps) => {
  const { toast } = useToast();
  const { couriers } = useCouriers();
  const { createShipment, getCourierType } = useCourierApi();

  const [enabledCouriers, setEnabledCouriers] = useState<EnabledCourier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ShipmentResult[]>([]);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [defaultWeight, setDefaultWeight] = useState(1);
  const [useOrderPrice, setUseOrderPrice] = useState(true);

  // Load enabled couriers when dialog opens
  useState(() => {
    if (open) {
      loadEnabledCouriers();
      loadSenderConfig();
    }
  });

  const loadEnabledCouriers = async () => {
    try {
      const { data: settings } = await supabase
        .from('courier_api_settings')
        .select('courier_id, is_enabled')
        .eq('is_enabled', true);

      if (!settings) return;

      const enabledIds = new Set(settings.map((s) => s.courier_id));
      
      const enabled = couriers
        .filter((c) => enabledIds.has(c.id) && getCourierType(c.name) !== null)
        .map((c) => ({ id: c.id, name: c.name, logo_url: c.logo_url }));

      setEnabledCouriers(enabled);
      
      if (enabled.length > 0 && !selectedCourierId) {
        setSelectedCourierId(enabled[0].id);
      }
    } catch (err) {
      console.error('Error loading enabled couriers:', err);
    }
  };

  const loadSenderConfig = async () => {
    try {
      const { data } = await supabase
        .from('company_settings')
        .select('company_name, phone')
        .limit(1)
        .single();

      if (data) {
        setSenderName(data.company_name || '');
        setSenderPhone(data.phone || '');
      }
    } catch (err) {
      console.error('Error loading sender config:', err);
    }
  };

  const extractCity = (address: string | null): string => {
    if (!address) return '';
    const parts = address.split(',').map((p) => p.trim());
    return parts.length >= 2 ? parts[0] : '';
  };

  const processOrders = async () => {
    if (!selectedCourierId) {
      toast({ title: 'Грешка', description: 'Изберете куриер', variant: 'destructive' });
      return;
    }

    const selectedCourier = enabledCouriers.find((c) => c.id === selectedCourierId);
    if (!selectedCourier) return;

    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    const newResults: ShipmentResult[] = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      try {
        const shipmentData: ShipmentData = {
          sender: {
            name: senderName,
            phone: senderPhone,
          },
          recipient: {
            name: order.customer_name,
            phone: order.phone,
            email: order.customer_email || undefined,
            city: extractCity(order.delivery_address),
            address: order.delivery_address || '',
          },
          codAmount: useOrderPrice ? order.total_price : 0,
          weight: defaultWeight,
          description: order.product_name || 'Стоки',
          reference: `Order #${order.id}`,
        };

        const result = await createShipment(selectedCourierId, selectedCourier.name, shipmentData);

        if (result.success && result.waybillNumber) {
          // Update order with tracking
          await updateOrderTracking(order.id, selectedCourierId, result.waybillNumber);

          // Save shipment
          await saveShipment(result.waybillNumber, selectedCourierId, order, shipmentData);

          newResults.push({
            orderId: order.id,
            orderCode: order.code,
            success: true,
            waybillNumber: result.waybillNumber,
          });
        } else {
          newResults.push({
            orderId: order.id,
            orderCode: order.code,
            success: false,
            error: result.error || 'Unknown error',
          });
        }
      } catch (err) {
        newResults.push({
          orderId: order.id,
          orderCode: order.code,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      setProgress(((i + 1) / orders.length) * 100);
      setResults([...newResults]);
    }

    setIsProcessing(false);

    const successCount = newResults.filter((r) => r.success).length;
    toast({
      title: 'Готово',
      description: `Създадени ${successCount} от ${orders.length} товарителници`,
    });

    if (successCount > 0) {
      onComplete?.();
    }
  };

  const updateOrderTracking = async (orderId: number, courierId: string, waybillNumber: string) => {
    const courier = couriers.find((c) => c.id === courierId);
    let trackingUrl = waybillNumber;

    if (courier?.url_pattern) {
      trackingUrl = courier.url_pattern.replace('{tracking}', waybillNumber);
    }

    await supabase
      .from('orders')
      .update({
        courier_id: courierId,
        courier_tracking_url: trackingUrl,
      })
      .eq('id', orderId);
  };

  const saveShipment = async (
    waybillNumber: string,
    courierId: string,
    order: Order,
    data: ShipmentData
  ) => {
    await supabase.from('shipments').insert({
      waybill_number: waybillNumber,
      courier_id: courierId,
      order_id: order.id,
      recipient_name: data.recipient.name,
      recipient_phone: data.recipient.phone,
      recipient_city: data.recipient.city,
      recipient_address: data.recipient.address,
      sender_name: data.sender.name,
      sender_phone: data.sender.phone,
      cod_amount: data.codAmount,
      weight: data.weight,
      status: 'created',
    });
  };

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBox className="w-5 h-5" />
            Масово създаване на товарителници
          </DialogTitle>
          <DialogDescription>
            Създаване на товарителници за {orders.length} избрани поръчки
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Courier Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Куриер
            </Label>
            <Select value={selectedCourierId} onValueChange={setSelectedCourierId} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Изберете куриер" />
              </SelectTrigger>
              <SelectContent>
                {enabledCouriers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      {c.logo_url && <img src={c.logo_url} alt={c.name} className="w-5 h-5 object-contain" />}
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sender Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Име на подател</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label>Телефон на подател</Label>
              <Input
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Тегло (кг)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={defaultWeight}
                onChange={(e) => setDefaultWeight(parseFloat(e.target.value) || 1)}
                disabled={isProcessing}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={useOrderPrice}
                onCheckedChange={setUseOrderPrice}
                disabled={isProcessing}
              />
              <Label>Използвай цената от поръчката като наложен платеж</Label>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Обработка...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm">
                {successCount > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    {successCount} успешни
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-4 h-4" />
                    {failedCount} неуспешни
                  </span>
                )}
              </div>

              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-1">
                  {results.map((result) => (
                    <div
                      key={result.orderId}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <span>Поръчка #{result.orderId}</span>
                      {result.success ? (
                        <span className="text-green-600 font-mono">{result.waybillNumber}</span>
                      ) : (
                        <span className="text-destructive text-xs">{result.error}</span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Warnings */}
          {orders.some((o) => !o.delivery_address) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <span>Някои поръчки нямат адрес за доставка. Те може да се провалят.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {results.length > 0 ? 'Затвори' : 'Отказ'}
          </Button>
          {results.length === 0 && (
            <Button onClick={processOrders} disabled={isProcessing || !selectedCourierId}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <FileBox className="w-4 h-4 mr-2" />
                  Създай {orders.length} товарителници
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
