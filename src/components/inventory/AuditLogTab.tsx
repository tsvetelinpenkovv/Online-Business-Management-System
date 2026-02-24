import { FC, useState, useMemo } from 'react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Search, RefreshCw, Eye, User, Calendar, 
  FileText, ArrowRight, Plus, Pencil, Trash2, 
  LogIn, LogOut, Download, Package, List, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const ACTION_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create: { label: 'Създаване', icon: Plus, color: 'bg-green-500/20 text-green-600 dark:text-green-400' },
  update: { label: 'Редакция', icon: Pencil, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  delete: { label: 'Изтриване', icon: Trash2, color: 'bg-destructive/20 text-destructive' },
  status_change: { label: 'Смяна статус', icon: ArrowRight, color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
  stock_movement: { label: 'Движение', icon: Package, color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' },
  login: { label: 'Вход', icon: LogIn, color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  logout: { label: 'Изход', icon: LogOut, color: 'bg-muted text-muted-foreground' },
  export: { label: 'Експорт', icon: Download, color: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' },
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

// Timeline item component
const TimelineItem: FC<{ log: any; onSelect: (log: any) => void }> = ({ log, onSelect }) => {
  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, icon: FileText, color: 'bg-muted text-muted-foreground' };
  const ActionIcon = actionInfo.icon;
  
  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${actionInfo.color} shrink-0`}>
          <ActionIcon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-border group-last:hidden" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{actionInfo.label}</span>
          <Badge variant="outline" className="text-[10px]">
            {TABLE_LABELS[log.table_name] || log.table_name}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {format(new Date(log.created_at), 'HH:mm:ss', { locale: bg })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          <User className="w-3 h-3 inline mr-1" />
          {log.user_email || 'Система'}
          {log.record_id && (
            <span className="ml-2">
              ID: <code className="bg-muted px-1 rounded">{log.record_id.substring(0, 8)}...</code>
            </span>
          )}
        </p>
        <Button variant="ghost" size="sm" className="h-6 text-xs mt-1 px-2" onClick={() => onSelect(log)}>
          <Eye className="w-3 h-3 mr-1" /> Детайли
        </Button>
      </div>
    </div>
  );
};

export const AuditLogTab: FC = () => {
  const { logs, loading, refresh } = useAuditLog();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<typeof logs[0] | null>(null);
  const [viewMode, setViewMode] = useState<string>('table');

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    logs.forEach(l => { if (l.user_email) users.add(l.user_email); });
    return [...users].sort();
  }, [logs]);

  const uniqueTables = useMemo(() => {
    return [...new Set(logs.map(l => l.table_name))];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        !search ||
        log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.record_id?.toLowerCase().includes(search.toLowerCase()) ||
        log.table_name.toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;
      const matchesUser = userFilter === 'all' || log.user_email === userFilter;
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(log.created_at) >= new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        matchesDate = matchesDate && new Date(log.created_at) <= toDate;
      }

      return matchesSearch && matchesAction && matchesTable && matchesUser && matchesDate;
    });
  }, [logs, search, actionFilter, tableFilter, userFilter, dateFrom, dateTo]);

  // Group logs by date for timeline
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, typeof logs>();
    filteredLogs.forEach(log => {
      const date = format(new Date(log.created_at), 'dd.MM.yyyy');
      const existing = groups.get(date) || [];
      existing.push(log);
      groups.set(date, existing);
    });
    return groups;
  }, [filteredLogs]);

  const formatChanges = (oldData: any, newData: any) => {
    if (!oldData && newData) {
      return Object.entries(newData).map(([key, value]) => ({ key, old: null, new: value }));
    }
    if (oldData && !newData) {
      return Object.entries(oldData).map(([key, value]) => ({ key, old: value, new: null }));
    }
    if (oldData && newData) {
      const changes: Array<{ key: string; old: any; new: any }> = [];
      const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
      allKeys.forEach(key => {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changes.push({ key, old: oldData[key], new: newData[key] });
        }
      });
      return changes;
    }
    return [];
  };

  const handleExportExcel = () => {
    const data = filteredLogs.map(log => ({
      'Дата': format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss'),
      'Потребител': log.user_email || 'Система',
      'Действие': ACTION_LABELS[log.action]?.label || log.action,
      'Таблица': TABLE_LABELS[log.table_name] || log.table_name,
      'ID на запис': log.record_id || '',
      'IP адрес': log.ip_address || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Одит лог');
    ws['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
    XLSX.writeFile(wb, `одит_лог_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = ['Дата', 'Потребител', 'Действие', 'Таблица', 'ID на запис', 'IP адрес'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss'),
      log.user_email || 'Система',
      ACTION_LABELS[log.action]?.label || log.action,
      TABLE_LABELS[log.table_name] || log.table_name,
      log.record_id || '',
      log.ip_address || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `одит_лог_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
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
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[200px]">
              <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Потребител" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички потребители</SelectItem>
              {uniqueUsers.map(email => (
                <SelectItem key={email} value={email}>{email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px] h-9" placeholder="От" />
          <span className="text-muted-foreground">—</span>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px] h-9" placeholder="До" />
          <div className="ml-auto flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="h-9">
                <TabsTrigger value="table" className="h-7 px-2"><List className="w-3.5 h-3.5" /></TabsTrigger>
                <TabsTrigger value="timeline" className="h-7 px-2"><Clock className="w-3.5 h-3.5" /></TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-1.5" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              <RefreshCw className="w-4 h-4 mr-1.5" /> Опресни
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
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
          ) : viewMode === 'timeline' ? (
            /* Timeline View */
            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {[...groupedByDate.entries()].map(([date, dateLogs]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3 sticky top-0 bg-card z-10 py-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{date}</span>
                      <Badge variant="secondary" className="text-[10px]">{dateLogs.length}</Badge>
                    </div>
                    <div className="ml-2">
                      {dateLogs.map(log => (
                        <TimelineItem key={log.id} log={log} onSelect={setSelectedLog} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            /* Table View */
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
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, icon: FileText, color: 'bg-muted text-muted-foreground' };
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
                        <Badge variant="outline">{TABLE_LABELS[log.table_name] || log.table_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.record_id && (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{log.record_id.substring(0, 8)}...</code>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
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
                  <p className="font-medium">{ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Таблица:</span>
                  <p className="font-medium">{TABLE_LABELS[selectedLog.table_name] || selectedLog.table_name}</p>
                </div>
                {selectedLog.record_id && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">ID на запис:</span>
                    <p className="font-mono text-xs bg-muted p-1 rounded mt-1">{selectedLog.record_id}</p>
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
                            <TableCell className="text-green-600 dark:text-green-400 text-xs">
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
                  <p className="text-xs bg-muted p-2 rounded mt-1 font-mono break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
