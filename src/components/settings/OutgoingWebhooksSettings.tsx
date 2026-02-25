import { FC, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useOutgoingWebhooks, WEBHOOK_EVENTS } from '@/hooks/useOutgoingWebhooks';
import { useToast } from '@/hooks/use-toast';
import { Webhook, Plus, Trash2, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

export const OutgoingWebhooksSettings: FC = () => {
  const { webhooks, loading, createWebhook, deleteWebhook, toggleWebhook } = useOutgoingWebhooks();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [secretKey, setSecretKey] = useState('');

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) return;
    setSaving(true);
    try {
      await createWebhook({
        name,
        url,
        events: selectedEvents,
        headers: null,
        secret_key: secretKey || null,
        is_enabled: true,
      });
      toast({ title: 'Успех', description: 'Webhook-ът беше създаден' });
      setShowAdd(false);
      setName(''); setUrl(''); setSelectedEvents([]); setSecretKey('');
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      toast({ title: 'Изтрит', description: 'Webhook-ът беше изтрит' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване', variant: 'destructive' });
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Изходящи Webhooks
              </CardTitle>
              <CardDescription>
                Изпращайте данни към външни системи при определени събития
              </CardDescription>
            </div>
            <Button onClick={() => setShowAdd(true)} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Добави
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Няма конфигурирани webhooks
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{wh.name}</span>
                      <Badge variant={wh.is_enabled ? 'default' : 'secondary'} className="text-xs">
                        {wh.is_enabled ? 'Активен' : 'Неактивен'}
                      </Badge>
                      {wh.failure_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {wh.failure_count} грешки
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{wh.url}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {wh.events.map(evt => (
                        <Badge key={evt} variant="outline" className="text-[10px] py-0">
                          {WEBHOOK_EVENTS.find(e => e.value === evt)?.label || evt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Switch checked={wh.is_enabled} onCheckedChange={() => toggleWebhook(wh.id)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(wh.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Нов Webhook
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Име</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="напр. ERP синхронизация" />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/webhook" />
            </div>
            <div className="space-y-2">
              <Label>Тайна ключова дума (опционално)</Label>
              <Input value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="За HMAC подпис на заявките" />
            </div>
            <div className="space-y-2">
              <Label>Събития</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map(evt => (
                  <label key={evt.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedEvents.includes(evt.value)}
                      onCheckedChange={() => toggleEvent(evt.value)}
                    />
                    {evt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Отказ</Button>
            <Button onClick={handleCreate} disabled={saving || !name || !url || selectedEvents.length === 0}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Създай
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
