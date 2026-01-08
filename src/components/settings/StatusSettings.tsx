import { FC, useState, useEffect } from 'react';
import { 
  Clock, Loader2, PhoneOff, CheckCircle2, CreditCard, Building2, 
  Truck, PackageX, Package, CircleCheck, Undo2, XCircle, Ban,
  Plus, Trash2, Pencil, Save, X, Warehouse
} from 'lucide-react';
import { useOrderStatuses, OrderStatusConfig } from '@/hooks/useOrderStatuses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_ICONS = [
  { name: 'Clock', icon: Clock },
  { name: 'Loader2', icon: Loader2 },
  { name: 'PhoneOff', icon: PhoneOff },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'CreditCard', icon: CreditCard },
  { name: 'Building2', icon: Building2 },
  { name: 'Truck', icon: Truck },
  { name: 'PackageX', icon: PackageX },
  { name: 'Package', icon: Package },
  { name: 'CircleCheck', icon: CircleCheck },
  { name: 'Undo2', icon: Undo2 },
  { name: 'XCircle', icon: XCircle },
  { name: 'Ban', icon: Ban },
];

const AVAILABLE_COLORS = [
  { name: 'primary', label: 'Син', bgClass: 'bg-primary/10', textClass: 'text-primary' },
  { name: 'info', label: 'Светлосин', bgClass: 'bg-info/10', textClass: 'text-info' },
  { name: 'success', label: 'Зелен', bgClass: 'bg-success/10', textClass: 'text-success' },
  { name: 'warning', label: 'Оранжев', bgClass: 'bg-warning/10', textClass: 'text-warning' },
  { name: 'destructive', label: 'Червен', bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
  { name: 'purple', label: 'Лилав', bgClass: 'bg-purple/10', textClass: 'text-purple' },
  { name: 'teal', label: 'Тюркоаз', bgClass: 'bg-teal/10', textClass: 'text-teal' },
  { name: 'muted', label: 'Сив', bgClass: 'bg-muted', textClass: 'text-muted-foreground' },
];

const getIconComponent = (iconName: string) => {
  const iconConfig = AVAILABLE_ICONS.find(i => i.name === iconName);
  return iconConfig?.icon || Clock;
};

const getColorClasses = (colorName: string) => {
  const colorConfig = AVAILABLE_COLORS.find(c => c.name === colorName);
  return colorConfig || AVAILABLE_COLORS[0];
};

export const StatusSettings: FC = () => {
  const { statuses, loading, addStatus, updateStatus, deleteStatus } = useOrderStatuses();
  const { toast } = useToast();
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('primary');
  const [newStatusIcon, setNewStatusIcon] = useState('Clock');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<OrderStatusConfig>>({});
  const [adding, setAdding] = useState(false);
  
  // Stock deduction status setting
  const [stockDeductionStatus, setStockDeductionStatus] = useState<string>('Изпратена');
  const [savingStockStatus, setSavingStockStatus] = useState(false);

  useEffect(() => {
    // Load saved stock deduction status
    const loadStockDeductionStatus = async () => {
      const { data } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'stock_deduction_status')
        .single();
      
      if (data?.setting_value) {
        setStockDeductionStatus(data.setting_value);
      }
    };
    loadStockDeductionStatus();
  }, []);

  const saveStockDeductionStatus = async (status: string) => {
    setSavingStockStatus(true);
    try {
      await supabase
        .from('api_settings')
        .upsert({
          setting_key: 'stock_deduction_status',
          setting_value: status,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
      
      setStockDeductionStatus(status);
      toast({
        title: 'Запазено',
        description: `Статус за изписване от склада: "${status}"`,
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на настройката',
        variant: 'destructive',
      });
    } finally {
      setSavingStockStatus(false);
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    setAdding(true);
    await addStatus(newStatusName.trim(), newStatusColor, newStatusIcon);
    setNewStatusName('');
    setNewStatusColor('primary');
    setNewStatusIcon('Clock');
    setAdding(false);
  };

  const startEditing = (status: OrderStatusConfig) => {
    setEditingId(status.id);
    setEditForm({
      name: status.name,
      color: status.color,
      icon: status.icon,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (editingId && editForm.name?.trim()) {
      await updateStatus(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stock Deduction Status Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            Настройка за склад
          </CardTitle>
          <CardDescription>
            Изберете при кой статус да се изписва автоматично наличност от склада
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="space-y-2 flex-1">
              <Label>Статус за изписване</Label>
              <Select 
                value={stockDeductionStatus} 
                onValueChange={saveStockDeductionStatus}
                disabled={savingStockStatus}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Изберете статус" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => {
                    const colorClasses = getColorClasses(status.color);
                    const Icon = getIconComponent(status.icon);
                    return (
                      <SelectItem key={status.id} value={status.name}>
                        <span className={`inline-flex items-center gap-1 ${colorClasses.textClass}`}>
                          <Icon className="w-3 h-3" />
                          {status.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Когато поръчка смени статуса си на "<strong>{stockDeductionStatus}</strong>", 
              количеството ще бъде автоматично изписано от склада.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добави нов статус
          </CardTitle>
          <CardDescription>
            Създайте персонализиран статус за поръчките
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-status-name">Име на статус</Label>
              <Input
                id="new-status-name"
                placeholder="Напр. В процес на плащане"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Цвят</Label>
              <Select value={newStatusColor} onValueChange={setNewStatusColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_COLORS.map((color) => (
                    <SelectItem key={color.name} value={color.name}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${color.bgClass} ${color.textClass} flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${color.textClass.replace('text-', 'bg-')}`} />
                        </div>
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Иконка</Label>
              <Select value={newStatusIcon} onValueChange={setNewStatusIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((iconItem) => {
                    const Icon = iconItem.icon;
                    return (
                      <SelectItem key={iconItem.name} value={iconItem.name}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {iconItem.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Преглед:</span>
            {(() => {
              const colorClasses = getColorClasses(newStatusColor);
              const Icon = getIconComponent(newStatusIcon);
              return (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${colorClasses.bgClass} ${colorClasses.textClass}`}>
                  <Icon className="w-3 h-3" />
                  {newStatusName || 'Нов статус'}
                </span>
              );
            })()}
          </div>

          <Button onClick={handleAddStatus} disabled={adding || !newStatusName.trim()}>
            {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Добави статус
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Съществуващи статуси</CardTitle>
          <CardDescription>
            Управлявайте статусите на поръчките - променяйте име, цвят и иконка
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statuses.map((status) => {
              const colorClasses = getColorClasses(status.color);
              const Icon = getIconComponent(status.icon);
              const isEditing = editingId === status.id;

              return (
                <div key={status.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="h-8"
                      />
                      <Select value={editForm.color} onValueChange={(v) => setEditForm({ ...editForm, color: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_COLORS.map((color) => (
                            <SelectItem key={color.name} value={color.name}>
                              {color.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={editForm.icon} onValueChange={(v) => setEditForm({ ...editForm, icon: v })}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ICONS.map((iconItem) => {
                            const IconComp = iconItem.icon;
                            return (
                              <SelectItem key={iconItem.name} value={iconItem.name}>
                                <div className="flex items-center gap-2">
                                  <IconComp className="w-3 h-3" />
                                  {iconItem.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={saveEditing}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${colorClasses.bgClass} ${colorClasses.textClass}`}>
                          <Icon className="w-3 h-3" />
                          {status.name}
                        </span>
                        {status.is_default && (
                          <span className="text-xs text-muted-foreground">(стандартен)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEditing(status)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!status.is_default && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteStatus(status.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
