import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { Button } from '@/components/ui/button';
import { Package, Settings, LogOut, Loader2, RefreshCw, Printer, Trash2, Tags } from 'lucide-react';
import { ORDER_STATUSES, OrderStatus } from '@/types/order';
import { StatusBadge } from '@/components/orders/StatusBadge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { orders, loading: ordersLoading, deleteOrder, deleteOrders, updateOrder, updateOrdersStatus, refetch } = useOrders();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phone.includes(searchTerm) ||
        order.id.toString().includes(searchTerm) ||
        order.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || order.source === sourceFilter;

      const orderDate = new Date(order.created_at);
      const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
      const matchesDateTo = !dateTo || orderDate <= dateTo;

      return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBulkPrint = () => {
    const selectedOrdersData = orders.filter(o => selectedOrders.includes(o.id));
    const ordersWithTracking = selectedOrdersData.filter(o => o.courier_tracking_url);
    
    if (ordersWithTracking.length === 0) {
      alert('Няма избрани поръчки с товарителници');
      return;
    }

    // Open each tracking URL in a new tab for printing
    ordersWithTracking.forEach(order => {
      if (order.courier_tracking_url) {
        window.open(order.courier_tracking_url, '_blank');
      }
    });
  };

  const handleBulkDelete = async () => {
    await deleteOrders(selectedOrders);
    setSelectedOrders([]);
    setShowBulkDeleteDialog(false);
  };

  const handleBulkStatusChange = async (status: OrderStatus) => {
    await updateOrdersStatus(selectedOrders, status);
    setSelectedOrders([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Поръчки</h1>
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} поръчки
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedOrders.length > 0 && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Tags className="w-4 h-4" />
                      Смени статус ({selectedOrders.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                    {ORDER_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={() => handleBulkStatusChange(status)}
                        className="cursor-pointer"
                      >
                        <StatusBadge status={status} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={handleBulkPrint} variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Печат ({selectedOrders.length})
                </Button>
                <Button 
                  onClick={() => setShowBulkDeleteDialog(true)} 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Изтрий ({selectedOrders.length})
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" onClick={refetch} title="Обнови">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate('/settings')} title="Настройки">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Изход">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6 space-y-4">
        <OrderFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onClearFilters={clearFilters}
        />

        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Няма намерени поръчки</p>
          </div>
        ) : (
          <OrdersTable
            orders={filteredOrders}
            onDelete={deleteOrder}
            onUpdate={updateOrder}
            selectedOrders={selectedOrders}
            onSelectionChange={setSelectedOrders}
          />
        )}
      </main>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на {selectedOrders.length} поръчки</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете избраните поръчки? Това действие не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
