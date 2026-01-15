import { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { useCouriers } from '@/hooks/useCouriers';
import { useCourierApi, CourierOffice, ShipmentData } from '@/hooks/useCourierApi';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { OfficeSearchDialog } from './OfficeSearchDialog';
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
import { Loader2, Truck, MapPin, Package, User, Phone, Mail, Home, CreditCard, FileBox, Download, Calculator } from 'lucide-react';

interface CreateShipmentDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (waybillNumber: string) => void;
}

interface SenderConfig {
  name: string;
  phone: string;
  city: string;
  address: string;
  postCode?: string;
  officeCode?: string;
}

interface EnabledCourier {
  id: string;
  name: string;
  logo_url: string | null;
  isEnabled: boolean;
}

export const CreateShipmentDialog = ({
  order,
  open,
  onOpenChange,
  onSuccess,
}: CreateShipmentDialogProps) => {
  const { toast } = useToast();
  const { couriers } = useCouriers();
  const { loading, createShipment, getLabel, calculatePrice, getCourierType } = useCourierApi();

  const [enabledCouriers, setEnabledCouriers] = useState<EnabledCourier[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [showOfficeSearch, setShowOfficeSearch] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'office' | 'address'>('address');
  const [creating, setCreating] = useState(false);
  const [createdWaybill, setCreatedWaybill] = useState<string | null>(null);
  const [downloadingLabel, setDownloadingLabel] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Sender (company) data
  const [sender, setSender] = useState<SenderConfig>({
    name: '',
    phone: '',
    city: '',
    address: '',
    postCode: '',
    officeCode: '',
  });

  // Recipient data (from order)
  const [recipient, setRecipient] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    officeCode: '',
    officeName: '',
  });

  // Shipment details
  const [codAmount, setCodAmount] = useState(0);
  const [weight, setWeight] = useState(1);
  const [description, setDescription] = useState('');
  const [packCount, setPackCount] = useState(1);
  const [payAfterTest, setPayAfterTest] = useState(false);
  const [notes, setNotes] = useState('');

  // Load enabled couriers and sender config
  useEffect(() => {
    if (open) {
      loadEnabledCouriers();
      loadSenderDefaults();
      setCreatedWaybill(null);
      setEstimatedPrice(null);
    }
  }, [open]);

  // Auto-fill recipient when order changes
  useEffect(() => {
    if (order) {
      setRecipient({
        name: order.customer_name || '',
        phone: order.phone || '',
        email: order.customer_email || '',
        city: extractCity(order.delivery_address),
        address: order.delivery_address || '',
        officeCode: '',
        officeName: '',
      });
      setCodAmount(order.total_price || 0);
      setDescription(order.product_name || 'Стоки');

      // If order has a courier, pre-select it
      if (order.courier_id) {
        setSelectedCourierId(order.courier_id);
      }
    }
  }, [order]);

  const loadEnabledCouriers = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('courier_api_settings')
        .select('courier_id, is_enabled')
        .eq('is_enabled', true);

      if (error) throw error;

      const enabledIds = new Set((settings || []).map((s) => s.courier_id));
      
      const enabled = couriers
        .filter((c) => enabledIds.has(c.id) && getCourierType(c.name) !== null)
        .map((c) => ({ ...c, isEnabled: true }));

      setEnabledCouriers(enabled);
      
      if (enabled.length > 0 && !selectedCourierId) {
        setSelectedCourierId(enabled[0].id);
      }
    } catch (err) {
      console.error('Error loading enabled couriers:', err);
    }
  };

  const loadSenderDefaults = async () => {
    try {
      // First try to get from api_settings (sender_defaults)
      const { data: settingsData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'sender_defaults')
        .maybeSingle();

      if (settingsData?.setting_value) {
        try {
          const parsed = JSON.parse(settingsData.setting_value);
          setSender(prev => ({ ...prev, ...parsed }));
          return;
        } catch {
          // Invalid JSON, continue to company settings
        }
      }

      // Fallback to company settings
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, phone, correspondence_address')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSender({
          name: data.company_name || '',
          phone: data.phone || '',
          city: extractCity(data.correspondence_address),
          address: data.correspondence_address || '',
        });
      }
    } catch (err) {
      console.error('Error loading sender config:', err);
    }
  };

  const handleCalculatePrice = async () => {
    const selectedCourier = enabledCouriers.find((c) => c.id === selectedCourierId);
    if (!selectedCourier || !sender.city || !recipient.city) return;

    setCalculatingPrice(true);
    try {
      const result = await calculatePrice(selectedCourierId, selectedCourier.name, {
        senderCity: sender.city,
        recipientCity: recipient.city,
        weight,
        codAmount,
        deliveryType,
      });

      if (result.success && result.price !== undefined) {
        setEstimatedPrice(result.price);
      } else {
        toast({
          title: 'Информация',
          description: result.error || 'Цената ще бъде изчислена при създаване',
        });
      }
    } catch (err) {
      console.error('Error calculating price:', err);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (!createdWaybill || !selectedCourierId) return;
    
    const selectedCourier = enabledCouriers.find((c) => c.id === selectedCourierId);
    if (!selectedCourier) return;

    setDownloadingLabel(true);
    try {
      const result = await getLabel(selectedCourierId, selectedCourier.name, createdWaybill);
      
      if (result.success && result.labelUrl) {
        // If it's a base64 PDF, create download link
        if (result.labelUrl.startsWith('JVB') || result.labelUrl.length > 100) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${result.labelUrl}`;
          link.download = `label-${createdWaybill}.pdf`;
          link.click();
        } else {
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
    } finally {
      setDownloadingLabel(false);
    }
  };

  const extractCity = (address: string | null): string => {
    if (!address) return '';
    // Simple extraction - look for common patterns
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      // Often city is first or second part
      return parts[0];
    }
    return '';
  };

  const handleOfficeSelect = (office: CourierOffice) => {
    setRecipient((prev) => ({
      ...prev,
      officeCode: office.code || office.id,
      officeName: office.name,
      city: office.city,
    }));
    setDeliveryType('office');
  };

  const handleSubmit = async () => {
    if (!selectedCourierId) {
      toast({ title: 'Грешка', description: 'Изберете куриер', variant: 'destructive' });
      return;
    }

    const selectedCourier = enabledCouriers.find((c) => c.id === selectedCourierId);
    if (!selectedCourier) {
      toast({ title: 'Грешка', description: 'Невалиден куриер', variant: 'destructive' });
      return;
    }

    if (!recipient.name || !recipient.phone) {
      toast({ title: 'Грешка', description: 'Моля попълнете данните на получателя', variant: 'destructive' });
      return;
    }

    if (deliveryType === 'office' && !recipient.officeCode) {
      toast({ title: 'Грешка', description: 'Моля изберете офис за доставка', variant: 'destructive' });
      return;
    }

    if (deliveryType === 'address' && !recipient.address) {
      toast({ title: 'Грешка', description: 'Моля въведете адрес за доставка', variant: 'destructive' });
      return;
    }

    setCreating(true);

    try {
      const shipmentData: ShipmentData = {
        sender: {
          name: sender.name,
          phone: sender.phone,
          city: sender.city,
          address: sender.address,
        },
        recipient: {
          name: recipient.name,
          phone: recipient.phone,
          email: recipient.email,
          city: recipient.city,
          address: deliveryType === 'address' ? recipient.address : undefined,
          officeCode: deliveryType === 'office' ? recipient.officeCode : undefined,
        },
        codAmount,
        weight,
        description,
        packCount,
        notes,
        payAfterTest,
        reference: order ? `Order #${order.id}` : undefined,
      };

      const result = await createShipment(selectedCourierId, selectedCourier.name, shipmentData);

      if (result.success && result.waybillNumber) {
        toast({
          title: 'Успех',
          description: `Товарителница ${result.waybillNumber} беше създадена`,
        });

        // Save to shipments table
        await saveShipment(result.waybillNumber, selectedCourierId, shipmentData);

        // Update order with tracking URL if applicable
        if (order) {
          await updateOrderTracking(order.id, selectedCourierId, result.waybillNumber);
        }

        onSuccess?.(result.waybillNumber);
        onOpenChange(false);
      } else {
        toast({
          title: 'Грешка при създаване',
          description: result.error || 'Неизвестна грешка',
          variant: 'destructive',
        });
        console.error('Shipment creation failed:', result.rawResponse);
      }
    } catch (err) {
      console.error('Error creating shipment:', err);
      toast({
        title: 'Грешка',
        description: 'Неуспешно създаване на товарителница',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const saveShipment = async (
    waybillNumber: string,
    courierId: string,
    data: ShipmentData
  ) => {
    try {
      await supabase.from('shipments').insert({
        waybill_number: waybillNumber,
        courier_id: courierId,
        order_id: order?.id,
        recipient_name: data.recipient.name,
        recipient_phone: data.recipient.phone,
        recipient_city: data.recipient.city,
        recipient_address: data.recipient.address,
        recipient_office_code: data.recipient.officeCode,
        sender_name: data.sender.name,
        sender_phone: data.sender.phone,
        sender_city: data.sender.city,
        sender_address: data.sender.address,
        cod_amount: data.codAmount,
        weight: data.weight,
        delivery_type: deliveryType,
        notes: data.notes,
        status: 'created',
      });
    } catch (err) {
      console.error('Error saving shipment:', err);
    }
  };

  const updateOrderTracking = async (orderId: number, courierId: string, waybillNumber: string) => {
    try {
      // Get courier tracking URL pattern
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
    } catch (err) {
      console.error('Error updating order tracking:', err);
    }
  };

  const selectedCourier = enabledCouriers.find((c) => c.id === selectedCourierId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBox className="w-5 h-5" />
              Създаване на товарителница
              {order && <span className="text-muted-foreground">- Поръчка #{order.id}</span>}
            </DialogTitle>
            <DialogDescription>
              Попълнете данните за товарителницата. Данните на получателя са автоматично попълнени от поръчката.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Courier Selection */}
            <div className="col-span-full space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Куриер
              </Label>
              <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете куриер" />
                </SelectTrigger>
                <SelectContent>
                  {enabledCouriers.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Няма активирани куриери
                    </SelectItem>
                  ) : (
                    enabledCouriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          {c.logo_url && (
                            <img src={c.logo_url} alt={c.name} className="w-5 h-5 object-contain" />
                          )}
                          {c.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {enabledCouriers.length === 0 && (
                <p className="text-xs text-destructive">
                  Няма активирани куриери. Моля конфигурирайте ги в Настройки → Куриери.
                </p>
              )}
            </div>

            {/* Delivery Type */}
            <div className="col-span-full space-y-2">
              <Label>Тип доставка</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={deliveryType === 'address' ? 'default' : 'outline'}
                  onClick={() => setDeliveryType('address')}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  До адрес
                </Button>
                <Button
                  type="button"
                  variant={deliveryType === 'office' ? 'default' : 'outline'}
                  onClick={() => setDeliveryType('office')}
                  className="flex-1"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  До офис/автомат
                </Button>
              </div>
            </div>

            {/* Recipient Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                Получател
              </h3>

              <div className="space-y-2">
                <Label htmlFor="recipientName">Име</Label>
                <Input
                  id="recipientName"
                  value={recipient.name}
                  onChange={(e) => setRecipient({ ...recipient, name: e.target.value })}
                  placeholder="Име на получателя"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Телефон</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="recipientPhone"
                    value={recipient.phone}
                    onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })}
                    placeholder="08xxxxxxxxx"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Имейл (незадължително)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipient.email}
                    onChange={(e) => setRecipient({ ...recipient, email: e.target.value })}
                    placeholder="email@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {deliveryType === 'address' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="recipientCity">Град</Label>
                    <Input
                      id="recipientCity"
                      value={recipient.city}
                      onChange={(e) => setRecipient({ ...recipient, city: e.target.value })}
                      placeholder="Град"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientAddress">Адрес</Label>
                    <Textarea
                      id="recipientAddress"
                      value={recipient.address}
                      onChange={(e) => setRecipient({ ...recipient, address: e.target.value })}
                      placeholder="Улица, номер, вход, етаж, апартамент"
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Офис/Автомат</Label>
                  {recipient.officeCode ? (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="font-medium text-sm">{recipient.officeName}</div>
                      <div className="text-xs text-muted-foreground">{recipient.city}</div>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-1"
                        onClick={() => setShowOfficeSearch(true)}
                      >
                        Промени
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowOfficeSearch(true)}
                      disabled={!selectedCourierId}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Избери офис/автомат
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Shipment Details Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <Package className="w-4 h-4" />
                Детайли на пратката
              </h3>

              <div className="space-y-2">
                <Label htmlFor="codAmount">Наложен платеж (лв)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="codAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={codAmount}
                    onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Тегло (кг)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packCount">Брой колети</Label>
                  <Input
                    id="packCount"
                    type="number"
                    min="1"
                    value={packCount}
                    onChange={(e) => setPackCount(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Съдържание</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Описание на съдържанието"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Бележки за куриера</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Допълнителни инструкции..."
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="payAfterTest"
                  checked={payAfterTest}
                  onCheckedChange={setPayAfterTest}
                />
                <Label htmlFor="payAfterTest">Отвори преди плащане (тест)</Label>
              </div>
            </div>

            {/* Sender Section (Collapsed) */}
            <div className="col-span-full space-y-2">
              <details className="group">
                <summary className="cursor-pointer font-medium text-sm flex items-center gap-2 hover:text-primary">
                  <Package className="w-4 h-4" />
                  Данни на подателя
                  <span className="text-xs text-muted-foreground">(редактирайте ако е необходимо)</span>
                </summary>
                <div className="mt-4 grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label>Име на фирмата</Label>
                    <Input
                      value={sender.name}
                      onChange={(e) => setSender({ ...sender, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input
                      value={sender.phone}
                      onChange={(e) => setSender({ ...sender, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Град</Label>
                    <Input
                      value={sender.city}
                      onChange={(e) => setSender({ ...sender, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Адрес</Label>
                    <Input
                      value={sender.address}
                      onChange={(e) => setSender({ ...sender, address: e.target.value })}
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отказ
            </Button>
            <Button onClick={handleSubmit} disabled={creating || loading || !selectedCourierId}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Създаване...
                </>
              ) : (
                <>
                  <FileBox className="w-4 h-4 mr-2" />
                  Създай товарителница
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Office Search Dialog */}
      {selectedCourier && (
        <OfficeSearchDialog
          open={showOfficeSearch}
          onOpenChange={setShowOfficeSearch}
          courierId={selectedCourierId}
          courierName={selectedCourier.name}
          onSelect={handleOfficeSelect}
        />
      )}
    </>
  );
};
