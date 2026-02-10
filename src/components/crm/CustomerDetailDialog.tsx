import { useState, useEffect } from 'react';
import { Customer, CustomerNote } from '@/hooks/useCustomers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, MapPin, Euro, ShoppingCart, Calendar, Tag, MessageSquare, Send, Package } from 'lucide-react';

interface CustomerDetailDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTags: (customerId: string, tags: string[]) => Promise<void>;
  fetchNotes: (customerId: string) => Promise<CustomerNote[]>;
  addNote: (customerId: string, note: string, userId?: string, userEmail?: string) => Promise<void>;
  availableTags: string[];
  tagColors: Record<string, string>;
}

interface OrderRow {
  id: number;
  code: string;
  product_name: string;
  total_price: number;
  status: string;
  created_at: string;
  quantity: number;
}

export const CustomerDetailDialog = ({
  customer, open, onOpenChange, onUpdateTags, fetchNotes, addNote, availableTags, tagColors,
}: CustomerDetailDialogProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (open && customer) {
      // Load notes
      fetchNotes(customer.id).then(setNotes);
      
      // Load orders by phone
      if (customer.phone) {
        setLoadingOrders(true);
        supabase
          .from('orders')
          .select('id, code, product_name, total_price, status, created_at, quantity')
          .eq('phone', customer.phone)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            setOrders((data || []) as OrderRow[]);
            setLoadingOrders(false);
          });
      }
    }
  }, [open, customer]);

  const toggleTag = async (tag: string) => {
    const currentTags = customer.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    await onUpdateTags(customer.id, newTags);
    customer.tags = newTags; // mutate for immediate UI update
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    await addNote(customer.id, newNote.trim(), user?.id, user?.email);
    const updated = await fetchNotes(customer.id);
    setNotes(updated);
    setNewNote('');
    setSubmittingNote(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{customer.name}</span>
            {customer.tags?.map(tag => (
              <Badge key={tag} variant="outline" className={`text-xs ${tagColors[tag] || ''}`}>{tag}</Badge>
            ))}
          </DialogTitle>
        </DialogHeader>

        {/* Customer info cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{customer.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{customer.email || '-'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <span>{customer.total_orders} поръчки</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{(customer.total_spent || 0).toFixed(2)} €</span>
          </div>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 mr-1" /> Поръчки ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Бележки ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="tags" className="text-xs sm:text-sm">
              <Tag className="w-3.5 h-3.5 mr-1" /> Тагове
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-3">
            {loadingOrders ? (
              <p className="text-center text-muted-foreground py-4">Зареждане...</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Няма намерени поръчки</p>
            ) : (
              <div className="max-h-[300px] overflow-y-auto rounded border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Код</TableHead>
                      <TableHead className="text-xs">Продукт</TableHead>
                      <TableHead className="text-xs text-center">К-во</TableHead>
                      <TableHead className="text-xs text-right">Сума</TableHead>
                      <TableHead className="text-xs">Статус</TableHead>
                      <TableHead className="text-xs">Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs font-mono">{order.code}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{order.product_name}</TableCell>
                        <TableCell className="text-xs text-center">{order.quantity}</TableCell>
                        <TableCell className="text-xs text-right font-medium">{order.total_price.toFixed(2)} €</TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{order.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('bg-BG')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-3 space-y-3">
            <div className="flex gap-2">
              <Textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Добави бележка за клиента..."
                rows={2}
                className="flex-1"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddNote(); } }}
              />
              <Button size="icon" onClick={handleAddNote} disabled={!newNote.trim() || submittingNote} className="self-end">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">Няма бележки</p>
              ) : notes.map(note => (
                <Card key={note.id}>
                  <CardContent className="p-3">
                    <p className="text-sm">{note.note}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>{note.created_by_email || 'Неизвестен'}</span>
                      <span>•</span>
                      <span>{new Date(note.created_at).toLocaleString('bg-BG')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tags" className="mt-3">
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => {
                const isActive = customer.tags?.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isActive ? 'default' : 'outline'}
                    className={`cursor-pointer text-sm px-3 py-1 ${!isActive ? tagColors[tag] || '' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} {isActive ? '✓' : '+'}
                  </Badge>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Кликни върху таг за да го добавиш/премахнеш</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
