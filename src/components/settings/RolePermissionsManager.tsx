import { FC, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, Crown, Package, ShoppingCart, FileText,
  Users, BarChart3, Truck, Settings, Eye, Plus,
  Pencil, Trash2, Loader2, Save, RefreshCw
} from 'lucide-react';

type AppRole = 'admin' | 'user' | 'warehouse_worker' | 'order_operator' | 'finance';

interface RolePermission {
  id: string;
  role: AppRole;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ROLE_INFO: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  admin: { 
    label: 'Администратор', 
    icon: Crown, 
    color: 'bg-yellow-500/20 text-yellow-600',
    description: 'Пълен достъп до всички модули и функции'
  },
  user: { 
    label: 'Потребител', 
    icon: Users, 
    color: 'bg-blue-500/20 text-blue-600',
    description: 'Базов достъп за работа с поръчки и преглед'
  },
  warehouse_worker: { 
    label: 'Складов работник', 
    icon: Package, 
    color: 'bg-green-500/20 text-green-600',
    description: 'Управление на склада и наличностите'
  },
  order_operator: { 
    label: 'Оператор поръчки', 
    icon: ShoppingCart, 
    color: 'bg-purple-500/20 text-purple-600',
    description: 'Обработка на поръчки и пратки'
  },
  finance: { 
    label: 'Финансов отдел', 
    icon: FileText, 
    color: 'bg-emerald-500/20 text-emerald-600',
    description: 'Фактури, отчети и финансова информация'
  },
};

const MODULE_INFO: Record<string, { label: string; icon: React.ElementType }> = {
  orders: { label: 'Поръчки', icon: ShoppingCart },
  inventory: { label: 'Склад', icon: Package },
  invoices: { label: 'Фактури', icon: FileText },
  settings: { label: 'Настройки', icon: Settings },
  users: { label: 'Потребители', icon: Users },
  audit_logs: { label: 'Одит лог', icon: Eye },
  reports: { label: 'Отчети', icon: BarChart3 },
  shipments: { label: 'Пратки', icon: Truck },
};

export const RolePermissionsManager: FC = () => {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Map<string, Partial<RolePermission>>>(new Map());
  const { toast } = useToast();

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role')
        .order('module');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на правата',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = (permId: string, field: keyof RolePermission, value: boolean) => {
    const existing = changes.get(permId) || {};
    setChanges(new Map(changes.set(permId, { ...existing, [field]: value })));
    
    // Update local state for immediate UI feedback
    setPermissions(permissions.map(p => 
      p.id === permId ? { ...p, [field]: value } : p
    ));
  };

  const saveChanges = async () => {
    if (changes.size === 0) return;

    setSaving(true);
    try {
      for (const [permId, updates] of changes.entries()) {
        const { error } = await supabase
          .from('role_permissions')
          .update(updates)
          .eq('id', permId);

        if (error) throw error;
      }

      toast({
        title: 'Успех',
        description: 'Правата бяха запазени',
      });
      setChanges(new Map());
    } catch (error: any) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно запазване на правата',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.role]) acc[perm.role] = [];
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  const roles = Object.keys(ROLE_INFO);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Описание на ролите
          </CardTitle>
          <CardDescription>
            Преглед на наличните роли и техните предназначения
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => {
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              return (
                <div key={role} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{info.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Права за достъп
            </CardTitle>
            <CardDescription>
              Управлявайте правата за всяка роля по модули
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchPermissions} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Опресни
            </Button>
            {changes.size > 0 && (
              <Button size="sm" onClick={saveChanges} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Запази ({changes.size})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            {roles.map(role => {
              const info = ROLE_INFO[role];
              const Icon = info.icon;
              const rolePerms = groupedPermissions[role] || [];

              return (
                <div key={role} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={info.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {info.label}
                    </Badge>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Модул</TableHead>
                          <TableHead className="text-center w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">Преглед</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Plus className="w-3 h-3" />
                              <span className="hidden sm:inline">Създаване</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Pencil className="w-3 h-3" />
                              <span className="hidden sm:inline">Редакция</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center w-[80px]">
                            <div className="flex items-center justify-center gap-1">
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Изтриване</span>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rolePerms.map(perm => {
                          const moduleInfo = MODULE_INFO[perm.module];
                          const ModuleIcon = moduleInfo?.icon || Settings;
                          return (
                            <TableRow key={perm.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <ModuleIcon className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{moduleInfo?.label || perm.module}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={perm.can_view}
                                  onCheckedChange={(checked) => handleToggle(perm.id, 'can_view', checked)}
                                  disabled={role === 'admin'}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={perm.can_create}
                                  onCheckedChange={(checked) => handleToggle(perm.id, 'can_create', checked)}
                                  disabled={role === 'admin'}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={perm.can_edit}
                                  onCheckedChange={(checked) => handleToggle(perm.id, 'can_edit', checked)}
                                  disabled={role === 'admin'}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={perm.can_delete}
                                  onCheckedChange={(checked) => handleToggle(perm.id, 'can_delete', checked)}
                                  disabled={role === 'admin'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {role !== roles[roles.length - 1] && <Separator className="mt-4" />}
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
