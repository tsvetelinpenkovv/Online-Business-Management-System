import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useReturns, Return, RETURN_STATUSES, RETURN_REASONS } from '@/hooks/useReturns';
import { buildPath } from '@/components/SecretPathGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CreateReturnDialog } from '@/components/returns/CreateReturnDialog';
import { ReturnDetailDialog } from '@/components/returns/ReturnDetailDialog';
import { Package, ArrowLeft, Plus, Search, RotateCcw, Trash2, MoreHorizontal, Eye, Loader2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';

const Returns = () => {
  const { user, loading: authLoading } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { returns, loading, fetchReturns, updateReturnStatus, deleteReturn } = useReturns();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate(buildPath('/auth'));
  }, [user, authLoading, navigate]);

  const filtered = returns.filter(r => {
    const matchesSearch = !searchTerm || 
      r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.order_id && String(r.order_id).includes(searchTerm)) ||
      (r.customer_phone && r.customer_phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI stats
  const stats = {
    total: returns.length,
    requested: returns.filter(r => r.status === 'requested').length,
    approved: returns.filter(r => r.status === 'approved').length,
    refunded: returns.filter(r => r.status === 'refunded').length,
    totalRefunded: returns.filter(r => r.status === 'refunded').reduce((sum, r) => sum + (r.refund_amount || 0), 0),
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <RotateCcw className="w-12 h-12 text-primary animate-spin" />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Връщания и Рекламации</h1>
              <p className="text-sm text-muted-foreground">{returns.length} записа</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => fetchReturns()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <ThemeToggle />
            {canCreate('orders') && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Нова заявка</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-2 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Общо</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Чакащи</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.requested}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Одобрени</p>
            <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Възстановени</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalRefunded.toFixed(2)} лв</p>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Търси по клиент, телефон, поръчка..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Филтър по статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всички статуси</SelectItem>
              {Object.entries(RETURN_STATUSES).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Поръчка</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Причина</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Сума</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Няма намерени връщания
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(ret => (
                    <TableRow key={ret.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedReturn(ret)}>
                      <TableCell className="font-mono text-xs">{ret.id.slice(0, 8)}</TableCell>
                      <TableCell>{ret.order_id ? `#${ret.order_id}` : '—'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{ret.customer_name}</p>
                          {ret.customer_phone && <p className="text-xs text-muted-foreground">{ret.customer_phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{RETURN_REASONS[ret.reason]}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ret.return_type === 'full' ? 'Пълно' : 'Частично'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{ret.refund_amount?.toFixed(2)} лв</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${RETURN_STATUSES[ret.status].color}`}>
                          {RETURN_STATUSES[ret.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ret.created_at), { addSuffix: true, locale: bg })}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedReturn(ret)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />Детайли
                            </DropdownMenuItem>
                            {canEdit('orders') && ret.status !== 'refunded' && ret.status !== 'rejected' && (
                              <>
                                <DropdownMenuSeparator />
                                {Object.entries(RETURN_STATUSES)
                                  .filter(([key]) => key !== ret.status)
                                  .map(([key, val]) => (
                                    <DropdownMenuItem key={key} onClick={() => updateReturnStatus(ret.id, key as Return['status'])} className="cursor-pointer">
                                      <Badge className={`text-xs mr-2 ${val.color}`}>{val.label}</Badge>
                                    </DropdownMenuItem>
                                  ))}
                              </>
                            )}
                            {canDelete('orders') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeleteId(ret.id)} className="cursor-pointer text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Изтрий
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <CreateReturnDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <ReturnDetailDialog returnData={selectedReturn} open={!!selectedReturn} onOpenChange={(open) => !open && setSelectedReturn(null)} onStatusChange={updateReturnStatus} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на заявка</AlertDialogTitle>
            <AlertDialogDescription>Сигурни ли сте? Действието е необратимо.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteReturn(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground">Изтрий</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Returns;
