import { FC, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Package, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { useStockDeduction } from '@/hooks/useStockDeduction';
import { useOrderStatuses } from '@/hooks/useOrderStatuses';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const StockDeductionSettings: FC = () => {
  const { settings, loading, updateSettings } = useStockDeduction();
  const { statuses } = useOrderStatuses();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(localSettings);
    setSaving(false);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Автоматично управление на наличности
          </CardTitle>
          <CardDescription>
            Настройте автоматичното приспадане и възстановяване на наличности при промяна на статуса на поръчките
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="auto-deduct" className="text-base font-medium">
                Активирай автоматично управление
              </Label>
              <p className="text-sm text-muted-foreground">
                Когато е включено, наличностите ще се актуализират автоматично при промяна на статуса
              </p>
            </div>
            <Switch
              id="auto-deduct"
              checked={localSettings.auto_deduct_enabled}
              onCheckedChange={(checked) => 
                setLocalSettings(prev => ({ ...prev, auto_deduct_enabled: checked }))
              }
            />
          </div>

          {localSettings.auto_deduct_enabled && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Системата ще търси продукти в склада по каталожен номер (SKU) от поръчката. 
                  Уверете се, че SKU кодовете съвпадат между поръчките и инвентара.
                </AlertDescription>
              </Alert>

              {/* Deduction Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-destructive" />
                  Статус за приспадане на наличност
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Когато поръчка достигне този статус, наличността автоматично ще бъде намалена
                </p>
                <Select 
                  value={localSettings.deduction_status}
                  onValueChange={(value) => 
                    setLocalSettings(prev => ({ ...prev, deduction_status: value }))
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Изберете статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Restore Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-success" />
                  Статус за възстановяване на наличност
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Когато поръчка бъде върната или отказана, наличността автоматично ще бъде възстановена
                </p>
                <Select 
                  value={localSettings.restore_status}
                  onValueChange={(value) => 
                    setLocalSettings(prev => ({ ...prev, restore_status: value }))
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Изберете статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reservation Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-warning" />
                  Статус за резервация на наличност
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Когато поръчка достигне този статус, количеството ще бъде маркирано като резервирано
                </p>
                <Select 
                  value={localSettings.reservation_status}
                  onValueChange={(value) => 
                    setLocalSettings(prev => ({ ...prev, reservation_status: value }))
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Изберете статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Запазване...
                </>
              ) : (
                'Запази настройките'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Как работи?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-medium">1</div>
            <div>
              <p className="font-medium text-foreground">Резервация</p>
              <p>Когато поръчка достигне статус "{localSettings.reservation_status}", количеството се маркира като резервирано, но все още е налично.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-xs font-medium">2</div>
            <div>
              <p className="font-medium text-foreground">Приспадане</p>
              <p>Когато поръчка достигне статус "{localSettings.deduction_status}", наличността се приспада от склада и резервацията се освобождава.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-medium">3</div>
            <div>
              <p className="font-medium text-foreground">Възстановяване</p>
              <p>Ако поръчка бъде маркирана като "{localSettings.restore_status}", приспаднатото количество се връща обратно в наличност.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
