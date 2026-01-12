import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShieldAlert, CheckCircle2, XCircle, HelpCircle, Loader2, RefreshCw, ExternalLink, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface CustomerCheck {
  id: number;
  customer_name: string;
  phone: string;
  customer_email: string | null;
  is_correct: boolean | null;
  created_at: string;
  source: string | null;
}

const Nekorekten = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [customers, setCustomers] = useState<CustomerCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [footerSettings, setFooterSettings] = useState<{
    footer_text: string | null;
    footer_link_text: string | null;
    footer_link: string | null;
    footer_website: string | null;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    const fetchFooterSettings = async () => {
      const { data } = await supabase
        .from('company_settings')
        .select('footer_text, footer_link_text, footer_link, footer_website')
        .limit(1)
        .maybeSingle();
      if (data) {
        setFooterSettings(data);
      }
    };
    fetchFooterSettings();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, phone, customer_email, is_correct, created_at, source')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setCustomers((data || []) as CustomerCheck[]);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на клиентите',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshCustomers = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
    toast({ title: 'Обновено', description: 'Списъкът е обновен' });
  };

  const getStatusIcon = (isCorrect: boolean | null) => {
    if (isCorrect === true) {
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    } else if (isCorrect === false) {
      return <XCircle className="w-4 h-4 text-destructive" />;
    }
    return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (isCorrect: boolean | null) => {
    if (isCorrect === true) {
      return <Badge className="bg-success/15 text-success pointer-events-none">Коректен</Badge>;
    } else if (isCorrect === false) {
      return <Badge className="bg-destructive/15 text-destructive pointer-events-none">Некоректен</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground pointer-events-none">Непроверен</Badge>;
  };

  // Filter customers
  const filteredCustomers = customers.filter(cust => {
    // Tab filter
    if (activeTab === 'correct' && cust.is_correct !== true) return false;
    if (activeTab === 'incorrect' && cust.is_correct !== false) return false;
    if (activeTab === 'unknown' && cust.is_correct !== null) return false;

    // Search filter - by email, name, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cust.phone.toLowerCase().includes(query) ||
        cust.customer_name?.toLowerCase().includes(query) ||
        (cust.customer_email && cust.customer_email.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Statistics
  const stats = {
    total: customers.length,
    correct: customers.filter(c => c.is_correct === true).length,
    incorrect: customers.filter(c => c.is_correct === false).length,
    unknown: customers.filter(c => c.is_correct === null).length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render mobile card
  const renderMobileCard = (customer: CustomerCheck) => (
    <Card 
      key={customer.id} 
      className={`overflow-hidden ${
        customer.is_correct === true ? 'border-l-4 border-l-success' : 
        customer.is_correct === false ? 'border-l-4 border-l-destructive' : 
        'border-l-4 border-l-muted'
      }`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="font-medium text-sm">{customer.customer_name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {getStatusIcon(customer.is_correct)}
            {getStatusBadge(customer.is_correct)}
          </div>
        </div>
        
        {customer.customer_email && (
          <div className="text-xs text-muted-foreground">
            {customer.customer_email}
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3" />
            <span className="font-mono">{customer.phone}</span>
          </div>
          <span>{format(new Date(customer.created_at), 'dd.MM.yy HH:mm', { locale: bg })}</span>
        </div>

        <div className="flex justify-end pt-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`https://nekorekten.com/bg/search?phone=${encodeURIComponent(customer.phone)}`, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Проверка
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-destructive shrink-0" />
                  <span className="truncate">Nekorekten Статистика</span>
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">
                  Проверка на клиенти за некоректност
                </p>
              </div>
            </div>
            <Button variant="outline" size={isMobile ? "icon" : "default"} onClick={refreshCustomers} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {!isMobile && <span className="ml-2">Обнови</span>}
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <Card className="p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground">Общо клиенти</div>
            </Card>
            <Card className="p-2 md:p-3 border-success/30">
              <div className="text-lg md:text-2xl font-bold text-success">{stats.correct}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> Коректни
              </div>
            </Card>
            <Card className="p-2 md:p-3 border-destructive/30">
              <div className="text-lg md:text-2xl font-bold text-destructive">{stats.incorrect}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                <XCircle className="w-2.5 h-2.5 md:w-3 md:h-3" /> Некоректни
              </div>
            </Card>
            <Card className="p-2 md:p-3">
              <div className="text-lg md:text-2xl font-bold text-muted-foreground">{stats.unknown}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                <HelpCircle className="w-2.5 h-2.5 md:w-3 md:h-3" /> Непровер.
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Търси по име, имейл или телефон..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="gap-1 text-xs md:text-sm">
                Всички
                <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="correct" className="gap-1 text-xs md:text-sm">
                <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-success" />
                <span className="hidden sm:inline">Коректни</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.correct}</Badge>
              </TabsTrigger>
              <TabsTrigger value="incorrect" className="gap-1 text-xs md:text-sm">
                <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-destructive" />
                <span className="hidden sm:inline">Некоректни</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.incorrect}</Badge>
              </TabsTrigger>
              <TabsTrigger value="unknown" className="gap-1 text-xs md:text-sm">
                <HelpCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Непровер.</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.unknown}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content */}
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Няма намерени клиенти</p>
                <p className="text-sm">Клиентите ще се появят тук след създаване на поръчки</p>
              </CardContent>
            </Card>
          ) : isMobile ? (
            // Mobile view - cards
            <div className="space-y-2">
              {filteredCustomers.map((customer) => renderMobileCard(customer))}
            </div>
          ) : (
            // Desktop view - table
            <Card>
              <CardContent className="p-0">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Клиент</TableHead>
                        <TableHead>Имейл</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Източник</TableHead>
                        <TableHead className="w-[110px]">Статус</TableHead>
                        <TableHead className="w-[150px]">Дата</TableHead>
                        <TableHead className="w-[100px]">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{customer.customer_name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{customer.customer_email || '—'}</TableCell>
                          <TableCell className="font-mono text-sm">{customer.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{customer.source || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(customer.is_correct)}
                              {getStatusBadge(customer.is_correct)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(customer.created_at), 'dd.MM.yyyy HH:mm', { locale: bg })}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(`https://nekorekten.com/bg/search?phone=${encodeURIComponent(customer.phone)}`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Провери
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card py-4">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs text-muted-foreground">
          <span>
            {footerSettings?.footer_text || 'Разработен от'}{' '}
            {footerSettings?.footer_link && footerSettings?.footer_link_text ? (
              <a 
                href={footerSettings.footer_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                {footerSettings.footer_link_text}
              </a>
            ) : (
              <span className="font-medium">{footerSettings?.footer_link_text || 'Цветелин Пенков'}</span>
            )}
          </span>
          {footerSettings?.footer_website && (
            <div className="mt-1">
              <a 
                href={footerSettings.footer_website.startsWith('http') ? footerSettings.footer_website : `https://${footerSettings.footer_website}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {footerSettings.footer_website}
              </a>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Nekorekten;
