import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, Smartphone, ArrowLeft, Search, 
  Check, CheckCheck, Clock, XCircle, RefreshCw, Loader2, List
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface ConnectixMessage {
  id: string;
  order_id: number | null;
  phone: string;
  customer_name: string | null;
  channel: 'viber' | 'sms';
  template_id: string | null;
  template_name: string | null;
  message_id: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  trigger_type: string | null;
  trigger_status: string | null;
  is_sandbox: boolean;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<ConnectixMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('connectix_messages')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setMessages((data || []) as ConnectixMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на съобщенията',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
    toast({ title: 'Обновено', description: 'Съобщенията са обновени' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-info" />;
      case 'delivered':
        return <Check className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'read':
        return <Badge className="bg-info/15 text-info">Прочетено</Badge>;
      case 'delivered':
        return <Badge className="bg-success/15 text-success">Доставено</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/15 text-destructive">Грешка</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">Изпратено</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    if (channel === 'viber') {
      return <MessageCircle className="w-4 h-4 text-purple" />;
    }
    return <Smartphone className="w-4 h-4 text-info" />;
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    // Tab filter
    if (activeTab === 'viber' && msg.channel !== 'viber') return false;
    if (activeTab === 'sms' && msg.channel !== 'sms') return false;

    // Status filter
    if (statusFilter !== 'all' && msg.status !== statusFilter) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        msg.phone.toLowerCase().includes(query) ||
        msg.customer_name?.toLowerCase().includes(query) ||
        msg.order_id?.toString().includes(query)
      );
    }

    return true;
  });

  // Statistics
  const stats = {
    total: messages.length,
    viber: messages.filter(m => m.channel === 'viber').length,
    sms: messages.filter(m => m.channel === 'sms').length,
    read: messages.filter(m => m.status === 'read').length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    sent: messages.filter(m => m.status === 'sent').length,
    failed: messages.filter(m => m.status === 'failed').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render mobile message card
  const renderMobileMessageCard = (msg: ConnectixMessage) => (
    <Card 
      key={msg.id} 
      className={`overflow-hidden ${msg.channel === 'viber' ? 'border-l-4 border-l-purple' : 'border-l-4 border-l-info'}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChannelIcon(msg.channel)}
            <span className="font-medium text-sm">{msg.channel === 'viber' ? 'Viber' : 'SMS'}</span>
            {msg.order_id && (
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-primary"
                onClick={() => navigate(`/?search=${msg.order_id}`)}
              >
                #{msg.order_id}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {getStatusIcon(msg.status)}
            {getStatusBadge(msg.status)}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{msg.customer_name || '—'}</span>
          <span className="font-mono text-xs text-muted-foreground">{msg.phone}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {msg.template_name || msg.trigger_status || '—'}
            {msg.is_sandbox && (
              <span className="text-[10px] text-warning border border-warning rounded px-1">
                Sandbox
              </span>
            )}
          </div>
          <span>{format(new Date(msg.sent_at), 'dd.MM.yy HH:mm', { locale: bg })}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-purple shrink-0" />
                <span className="truncate">Съобщения</span>
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">
                История на Viber и SMS съобщенията
              </p>
            </div>
          </div>
          <Button variant="outline" size={isMobile ? "icon" : "default"} onClick={refreshMessages} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {!isMobile && <span className="ml-2">Обнови</span>}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
          <Card className="p-2 md:p-3">
            <div className="text-lg md:text-2xl font-bold">{stats.total}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Общо</div>
          </Card>
          <Card className="p-2 md:p-3 border-purple/30">
            <div className="text-lg md:text-2xl font-bold text-purple">{stats.viber}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
              <MessageCircle className="w-2.5 h-2.5 md:w-3 md:h-3" /> Viber
            </div>
          </Card>
          <Card className="p-2 md:p-3 border-info/30">
            <div className="text-lg md:text-2xl font-bold text-info">{stats.sms}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
              <Smartphone className="w-2.5 h-2.5 md:w-3 md:h-3" /> SMS
            </div>
          </Card>
          <Card className="p-2 md:p-3">
            <div className="text-lg md:text-2xl font-bold text-success">{stats.delivered + stats.read}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-2.5 h-2.5 md:w-3 md:h-3" /> Достав.
            </div>
          </Card>
          <Card className="p-2 md:p-3 hidden lg:block">
            <div className="text-2xl font-bold text-info">{stats.read}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCheck className="w-3 h-3" /> Прочетени
            </div>
          </Card>
          <Card className="p-2 md:p-3 hidden lg:block">
            <div className="text-2xl font-bold text-muted-foreground">{stats.sent}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Изпратени
            </div>
          </Card>
          <Card className="p-2 md:p-3 hidden lg:block">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Грешки
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Търси..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <List className="w-4 h-4 text-primary" />
                      Всички
                    </span>
                  </SelectItem>
                  <SelectItem value="read">
                    <span className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-info" />
                      <span className="text-info">Прочетени</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="delivered">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-success">Доставени</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="sent">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Изпратени</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="failed">
                    <span className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive">Грешки</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all" className="gap-1 text-xs md:text-sm">
              <List className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary" />
              Всички
              <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{messages.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="viber" className="gap-1 text-xs md:text-sm">
              <MessageCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple" />
              Viber
              <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.viber}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-1 text-xs md:text-sm">
              <Smartphone className="w-3 h-3 md:w-3.5 md:h-3.5 text-info" />
              SMS
              <Badge variant="secondary" className="text-[10px] md:text-xs hidden sm:inline-flex">{stats.sms}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Messages Content */}
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Няма намерени съобщения</p>
              <p className="text-sm">Съобщенията ще се появят тук след като изпратите първото</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile view - cards
          <div className="space-y-2">
            {filteredMessages.map((msg) => renderMobileMessageCard(msg))}
          </div>
        ) : (
          // Desktop view - table
          <Card>
            <CardContent className="p-0">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[60px]">Канал</TableHead>
                      <TableHead className="w-[80px]">Поръчка</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Шаблон</TableHead>
                      <TableHead className="w-[110px]">Статус</TableHead>
                      <TableHead className="w-[150px]">Изпратено</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((msg) => (
                      <TableRow key={msg.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getChannelIcon(msg.channel)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {msg.order_id ? (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-primary"
                              onClick={() => navigate(`/?search=${msg.order_id}`)}
                            >
                              #{msg.order_id}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {msg.customer_name || '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {msg.phone}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {msg.template_name || msg.trigger_status || '—'}
                          {msg.is_sandbox && (
                            <Badge variant="outline" className="ml-2 text-xs text-warning border-warning">
                              Sandbox
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(msg.status)}
                            {getStatusBadge(msg.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>
                            {format(new Date(msg.sent_at), 'dd.MM.yyyy', { locale: bg })}
                          </div>
                          <div>
                            {format(new Date(msg.sent_at), 'HH:mm:ss', { locale: bg })}
                          </div>
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
  );
};

export default Messages;