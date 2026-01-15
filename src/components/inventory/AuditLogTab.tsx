import { FC, useState, useMemo } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, Search, RefreshCw, Eye, User, Calendar, 
  FileText, ArrowRight, Plus, Pencil, Trash2, 
  LogIn, LogOut, Download, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create: { label: 'Създаване', icon: Plus, color: 'bg-success/20 text-success' },
  update: { label: 'Редакция', icon: Pencil, color: 'bg-blue-500/20 text-blue-600' },
  delete: { label: 'Изтриване', icon: Trash2, color: 'bg-destructive/20 text-destructive' },
  status_change: { label: 'Смяна статус', icon: ArrowRight, color: 'bg-amber-500/20 text-amber-600' },
  stock_movement: { label: 'Движение', icon: Package, color: 'bg-purple-500/20 text-purple-600' },
  login: { label: 'Вход', icon: LogIn, color: 'bg-emerald-500/20 text-emerald-600' },
  logout: { label: 'Изход', icon: LogOut, color: 'bg-gray-500/20 text-gray-600' },
  export: { label: 'Експорт', icon: Download, color: 'bg-cyan-500/20 text-cyan-600' },
};

const TABLE_LABELS: Record<string, string> = {
  orders: 'Поръчки',
  inventory_products: 'Продукти',
  stock_movements: 'Движения',
  stock_documents: 'Документи',
  suppliers: 'Доставчици',
  inventory_categories: 'Категории',
  invoices: 'Фактури',
  shipments: 'Пратки',
  allowed_users: 'Потребители',
  company_settings: 'Настройки',
  warehouses: 'Складове',
};

export const AuditLogTab: FC = () => {
  const { logs, loading, refresh } = useAuditLog();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<typeof logs[0] | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        !search ||
        log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.record_id?.toLowerCase().includes(search.toLowerCase()) ||
        log.table_name.toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;

      return matchesSearch && matchesAction && matchesTable;
    });
  }, [logs, search, actionFilter, tableFilter]);

  const uniqueTables = useMemo(() => {
    return [...new Set(logs.map(l => l.table_name))];
  }, [logs]);

  const formatChanges = (oldData: any, newData: any) => {
    if (!oldData && newData) {
      return Object.entries(newData).map(([key, value]) => ({
        key,
        old: null,
        new: value,
      }));
    }

    if (oldData && !newData) {
      return Object.entries(oldData).map(([key, value]) => ({
        key,
        old: value,
        new: null,
      }));
    }

    if (oldData && newData) {
      const changes: Array<{ key: string; old: any; new: any }> = [];
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      
      allKeys.forEach(key => {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changes.push({
            key,
            old: oldData[key],
            new: newData[key],
          });
        }
      });
      
      return changes;
    }

    return [];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Търси по потребител, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Действие" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички действия</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Таблица" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички таблици</SelectItem>
              {uniqueTables.map(table => (
                <SelectItem key={table} value={table}>
                  {TABLE_LABELS[table] || table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => refresh()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Опресни
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Одит лог ({filteredLogs.length} записа)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Зареждане...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Няма намерени записи</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата/Час</TableHead>
                  <TableHead>Потребител</TableHead>
                  <TableHead>Действие</TableHead>
                  <TableHead>Таблица</TableHead>
                  <TableHead>ID на запис</TableHead>
                  <TableHead className="text-right">Детайли</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || { 
                    label: log.action, 
                    icon: FileText, 
                    color: 'bg-gray-500/20 text-gray-600' 
                  };
                  const ActionIcon = actionInfo.icon;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {log.user_email || 'Система'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${actionInfo.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          {actionInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TABLE_LABELS[log.table_name] || log.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.record_id && (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {log.record_id.substring(0, 8)}...
                          </code>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Детайли на промяната
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Дата:</span>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: bg })}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Потребител:</span>
                  <p className="font-medium">{selectedLog.user_email || 'Система'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Действие:</span>
                  <p className="font-medium">
                    {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Таблица:</span>
                  <p className="font-medium">
                    {TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}
                  </p>
                </div>
                {selectedLog.record_id && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">ID на запис:</span>
                    <p className="font-mono text-xs bg-muted p-1 rounded mt-1">
                      {selectedLog.record_id}
                    </p>
                  </div>
                )}
              </div>

              {(selectedLog.old_data || selectedLog.new_data) && (
                <div>
                  <h4 className="font-medium mb-2">Промени:</h4>
                  <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Поле</TableHead>
                          <TableHead>Стара стойност</TableHead>
                          <TableHead>Нова стойност</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formatChanges(selectedLog.old_data, selectedLog.new_data).map((change, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-xs">{change.key}</TableCell>
                            <TableCell className="text-destructive/80 text-xs">
                              {change.old !== null ? JSON.stringify(change.old) : '-'}
                            </TableCell>
                            <TableCell className="text-success text-xs">
                              {change.new !== null ? JSON.stringify(change.new) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <span className="text-muted-foreground text-sm">User Agent:</span>
                  <p className="text-xs bg-muted p-2 rounded mt-1 font-mono break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
