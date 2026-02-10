import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildPath } from '@/components/SecretPathGuard';
import { CustomerDetailDialog } from '@/components/crm/CustomerDetailDialog';
import { ArrowLeft, Users, Search, RefreshCw, Loader2, Download, UserPlus, Phone, Mail, Euro, ShoppingCart } from 'lucide-react';

const TAG_COLORS: Record<string, string> = {
  'VIP': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Нов': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Редовен': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Проблемен': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'Лоялен': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Корпоративен': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Дропшипинг': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
};

export default function CRM() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { customers, loading, fetchCustomers, syncCustomersFromOrders, AVAILABLE_TAGS, updateCustomerTags, fetchNotes, addNote } = useCustomers();
  const { logoUrl } = useCompanyLogo();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate(buildPath('/auth'));
  }, [user, authLoading, navigate]);

  const filtered = customers.filter(c => {
    const matchesSearch = !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || c.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Stats
  const totalCustomers = customers.length;
  const vipCount = customers.filter(c => c.tags?.includes('VIP')).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgOrderValue = totalCustomers > 0 
    ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.reduce((sum, c) => sum + (c.total_orders || 0), 0) || 0
    : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Users className="w-12 h-12 text-primary animate-pulse" />
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Зареждане на CRM...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('/'))} title="Назад към поръчки" className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Лого" className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" loading="eager" />
                ) : (
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                )}
                <h1 className="text-lg sm:text-xl font-bold truncate">CRM - Клиенти</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={syncCustomersFromOrders} className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" />
                Синхронизирай от поръчки
              </Button>
              <Button variant="outline" size="icon" onClick={syncCustomersFromOrders} className="sm:hidden" title="Синхронизирай">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => fetchCustomers()} title="Обнови">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Клиенти</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">VIP</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{vipCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Общо приходи</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{totalRevenue.toFixed(2)} €</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Ср. стойност</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{avgOrderValue.toFixed(2)} €</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Търси по име, телефон или имейл..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge variant={!selectedTag ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setSelectedTag(null)}>Всички</Badge>
            {AVAILABLE_TAGS.map(tag => (
              <Badge key={tag} variant={selectedTag === tag ? 'default' : 'outline'} className={`cursor-pointer text-xs ${selectedTag === tag ? '' : TAG_COLORS[tag] || ''}`} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}>
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Customers table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Клиент</TableHead>
                    <TableHead className="min-w-[120px]">Телефон</TableHead>
                    <TableHead className="hidden sm:table-cell">Имейл</TableHead>
                    <TableHead className="text-center">Поръчки</TableHead>
                    <TableHead className="text-right">Общо (€)</TableHead>
                    <TableHead className="hidden sm:table-cell">Последна поръчка</TableHead>
                    <TableHead>Тагове</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {customers.length === 0 ? (
                          <div className="space-y-2">
                            <p>Няма клиенти. Натиснете "Синхронизирай от поръчки" за да импортирате клиенти от съществуващите поръчки.</p>
                          </div>
                        ) : 'Няма намерени клиенти'}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(customer => (
                    <TableRow key={customer.id} className="cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{customer.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[180px]">{customer.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">{customer.total_orders}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{(customer.total_spent || 0).toFixed(2)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('bg-BG') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {customer.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className={`text-[10px] px-1.5 py-0 ${TAG_COLORS[tag] || ''}`}>{tag}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <CustomerDetailDialog
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onOpenChange={(open) => !open && setSelectedCustomer(null)}
          onUpdateTags={updateCustomerTags}
          fetchNotes={fetchNotes}
          addNote={addNote}
          availableTags={AVAILABLE_TAGS}
          tagColors={TAG_COLORS}
        />
      )}
    </div>
  );
}
