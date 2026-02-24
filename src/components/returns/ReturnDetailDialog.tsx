import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Return, RETURN_STATUSES, RETURN_REASONS, ITEM_CONDITIONS } from '@/hooks/useReturns';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { ArrowRight, CheckCircle, XCircle, Package, Truck, CreditCard } from 'lucide-react';

interface Props {
  returnData: Return | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: Return['status']) => void;
}

const STATUS_FLOW: Record<string, Return['status'][]> = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['refunded'],
};

const REFUND_METHODS: Record<string, string> = {
  cash: 'Наличен',
  card: 'Карта',
  bank_transfer: 'Банков превод',
  store_credit: 'Кредит в магазина',
};

export const ReturnDetailDialog = ({ returnData, open, onOpenChange, onStatusChange }: Props) => {
  const { canEdit } = usePermissions();
  if (!returnData) return null;

  const nextStatuses = STATUS_FLOW[returnData.status] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Връщане #{returnData.id.slice(0, 8)}
            <Badge className={RETURN_STATUSES[returnData.status].color}>
              {RETURN_STATUSES[returnData.status].label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Flow */}
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(RETURN_STATUSES).map(([key, val], idx) => (
              <div key={key} className="flex items-center gap-1">
                {idx > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                <Badge variant={returnData.status === key ? 'default' : 'outline'} className={returnData.status === key ? val.color : 'opacity-50'}>
                  {val.label}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Поръчка</p>
              <p className="font-medium">{returnData.order_id ? `#${returnData.order_id}` : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Клиент</p>
              <p className="font-medium">{returnData.customer_name}</p>
              {returnData.customer_phone && <p className="text-xs text-muted-foreground">{returnData.customer_phone}</p>}
            </div>
            <div>
              <p className="text-muted-foreground">Причина</p>
              <p className="font-medium">{RETURN_REASONS[returnData.reason]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Тип</p>
              <p className="font-medium">{returnData.return_type === 'full' ? 'Пълно връщане' : 'Частично връщане'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Сума за възстановяване</p>
              <p className="font-medium text-lg">{returnData.refund_amount?.toFixed(2)} лв</p>
            </div>
            <div>
              <p className="text-muted-foreground">Метод</p>
              <p className="font-medium">{returnData.refund_method ? REFUND_METHODS[returnData.refund_method] || returnData.refund_method : '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Дата на заявка</p>
              <p className="font-medium">{format(new Date(returnData.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}</p>
            </div>
            {returnData.reason_details && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Детайли</p>
                <p className="font-medium">{returnData.reason_details}</p>
              </div>
            )}
          </div>

          {/* Items */}
          {returnData.return_items && returnData.return_items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Артикули ({returnData.return_items.length})</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Продукт</TableHead>
                      <TableHead>К-во</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Общо</TableHead>
                      <TableHead>Състояние</TableHead>
                      <TableHead>Рестокиране</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnData.return_items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.product_name}</p>
                          {item.catalog_number && <p className="text-xs text-muted-foreground">{item.catalog_number}</p>}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price.toFixed(2)} лв</TableCell>
                        <TableCell className="font-medium">{item.total_price.toFixed(2)} лв</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{ITEM_CONDITIONS[item.condition as keyof typeof ITEM_CONDITIONS] || item.condition}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.restock ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Actions */}
          {canEdit('orders') && nextStatuses.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-end gap-2">
                {nextStatuses.map(status => (
                  <Button
                    key={status}
                    variant={status === 'rejected' ? 'destructive' : 'default'}
                    onClick={() => { onStatusChange(returnData.id, status); onOpenChange(false); }}
                    className="gap-1.5"
                  >
                    {status === 'approved' && <><CheckCircle className="w-4 h-4" />Одобри</>}
                    {status === 'received' && <><Package className="w-4 h-4" />Получена</>}
                    {status === 'refunded' && <><CreditCard className="w-4 h-4" />Възстанови сума</>}
                    {status === 'rejected' && <><XCircle className="w-4 h-4" />Отхвърли</>}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
