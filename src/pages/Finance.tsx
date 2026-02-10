import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useFinance, EXPENSE_CATEGORIES, type OrderFinance } from '@/hooks/useFinance';
import { buildPath } from '@/components/SecretPathGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, Trash2, Loader2, Receipt, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Платена</Badge>;
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Частично</Badge>;
    default:
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><AlertCircle className="w-3 h-3 mr-1" />Неплатена</Badge>;
  }
};

const Finance = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { canEdit, canCreate, canDelete } = usePermissions();
  const { orders, expenses, loading, updatePaymentStatus, addExpense, deleteExpense, getSummary } = useFinance();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add expense form
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('other');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  // Payment edit
  const [editingOrder, setEditingOrder] = useState<OrderFinance | null>(null);
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');

  const summary = useMemo(() => getSummary(dateFrom, dateTo), [getSummary, dateFrom, dateTo]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (dateFrom) filtered = filtered.filter(o => o.created_at >= dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setDate(to.getDate() + 1);
      filtered = filtered.filter(o => o.created_at < to.toISOString());
    }
    if (paymentFilter !== 'all') filtered = filtered.filter(o => o.payment_status === paymentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [orders, dateFrom, dateTo, paymentFilter, searchQuery]);

  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    if (dateFrom) filtered = filtered.filter(e => e.expense_date >= dateFrom);
    if (dateTo) filtered = filtered.filter(e => e.expense_date <= dateTo);
    return filtered;
  }, [expenses, dateFrom, dateTo]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate(buildPath('/auth'));
    return null;
  }

  const handleAddExpense = async () => {
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    await addExpense({
      amount: Number(expenseAmount),
      category: expenseCategory,
      description: expenseDescription || null,
      expense_date: expenseDate,
    });
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseCategory('other');
    setAddExpenseOpen(false);
  };

  const handleUpdatePayment = async () => {
    if (!editingOrder) return;
    await updatePaymentStatus(
      editingOrder.id,
      editPaymentStatus,
      Number(editPaidAmount),
      editPaymentMethod || undefined
    );
    setEditingOrder(null);
  };

  const openPaymentEdit = (order: OrderFinance) => {
    setEditingOrder(order);
    setEditPaymentStatus(order.payment_status);
    setEditPaidAmount(String(order.paid_amount || 0));
    setEditPaymentMethod(order.payment_method || '');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">💰 Финанси</h1>
              <p className="text-sm text-muted-foreground">Проследяване на плащания и отчети</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36" />
            <span className="text-muted-foreground">—</span>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" />Общо приходи
              </div>
              <p className="text-2xl font-bold">{summary.totalRevenue.toFixed(2)} лв</p>
              <p className="text-xs text-muted-foreground">{summary.orderCount} поръчки</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm mb-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />Платени
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.totalPaid.toFixed(2)} лв</p>
              <p className="text-xs text-muted-foreground">{summary.paidCount} поръчки</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm mb-1 text-red-600">
                <AlertCircle className="w-4 h-4" />Неплатени
              </div>
              <p className="text-2xl font-bold text-red-600">{summary.totalUnpaid.toFixed(2)} лв</p>
              <p className="text-xs text-muted-foreground">{summary.unpaidCount} поръчки</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm mb-1 text-yellow-600">
                <Clock className="w-4 h-4" />Частично
              </div>
              <p className="text-2xl font-bold text-yellow-600">{summary.totalPartial.toFixed(2)} лв</p>
              <p className="text-xs text-muted-foreground">{summary.partialCount} поръчки</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm mb-1 text-red-500">
                <TrendingDown className="w-4 h-4" />Разходи
              </div>
              <p className="text-2xl font-bold text-red-500">{summary.totalExpenses.toFixed(2)} лв</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm mb-1 text-primary">
                <TrendingUp className="w-4 h-4" />Печалба
              </div>
              <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.profit.toFixed(2)} лв
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments">
          <TabsList>
            <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-1" />Плащания</TabsTrigger>
            <TabsTrigger value="expenses"><Receipt className="w-4 h-4 mr-1" />Разходи</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Input placeholder="Търси по клиент, код, продукт..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички</SelectItem>
                  <SelectItem value="paid">Платени</SelectItem>
                  <SelectItem value="unpaid">Неплатени</SelectItem>
                  <SelectItem value="partial">Частично</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Продукт</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead className="text-right">Платено</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Метод</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Няма намерени поръчки</TableCell></TableRow>
                  ) : filteredOrders.slice(0, 100).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.code}</TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.product_name}</TableCell>
                      <TableCell className="text-right font-medium">{Number(order.total_price).toFixed(2)} лв</TableCell>
                      <TableCell className="text-right">{Number(order.paid_amount).toFixed(2)} лв</TableCell>
                      <TableCell><PaymentStatusBadge status={order.payment_status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{order.payment_method || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>
                        {canEdit('invoices') && (
                          <Button variant="ghost" size="sm" onClick={() => openPaymentEdit(order)}>Редактирай</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Разходи за периода</h3>
              {canCreate('invoices') && (
                <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-1" />Добави разход</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Нов разход</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Сума (лв)</Label>
                        <Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      <div>
                        <Label>Категория</Label>
                        <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Дата</Label>
                        <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                      </div>
                      <div>
                        <Label>Описание</Label>
                        <Textarea value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Опционално описание..." />
                      </div>
                      <Button onClick={handleAddExpense} className="w-full">Добави</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead className="text-right">Сума</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Няма разходи за периода</TableCell></TableRow>
                  ) : filteredExpenses.map(expense => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.expense_date), 'dd.MM.yyyy')}</TableCell>
                      <TableCell><Badge variant="outline">{EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label || expense.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{expense.description || '—'}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">{Number(expense.amount).toFixed(2)} лв</TableCell>
                      <TableCell>
                        {canDelete('invoices') && (
                          <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)} className="text-destructive h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={open => !open && setEditingOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактиране на плащане — {editingOrder?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Обща сума</Label>
              <p className="text-lg font-bold">{editingOrder ? Number(editingOrder.total_price).toFixed(2) : 0} лв</p>
            </div>
            <div>
              <Label>Статус на плащане</Label>
              <Select value={editPaymentStatus} onValueChange={setEditPaymentStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Неплатена</SelectItem>
                  <SelectItem value="partial">Частично платена</SelectItem>
                  <SelectItem value="paid">Платена</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Платена сума (лв)</Label>
              <Input
                type="number"
                value={editPaidAmount}
                onChange={e => setEditPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Метод на плащане</Label>
              <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Избери метод" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">В брой</SelectItem>
                  <SelectItem value="card">С карта</SelectItem>
                  <SelectItem value="bank_transfer">Банков превод</SelectItem>
                  <SelectItem value="cod">Наложен платеж</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdatePayment} className="w-full">Запази</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Finance;
