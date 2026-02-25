import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrderTemplates, OrderTemplate } from '@/hooks/useOrderTemplates';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText, Trash2, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderData: Record<string, any>;
}

export const SaveTemplateDialog: FC<SaveTemplateDialogProps> = ({ open, onOpenChange, orderData }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { saveTemplate } = useOrderTemplates();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await saveTemplate(name.trim(), orderData);
      toast({ title: 'Успех', description: 'Шаблонът беше запазен' });
      setName('');
      onOpenChange(false);
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Запази като шаблон
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Име на шаблона</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="напр. Стандартна поръчка..." />
          </div>
          <div className="text-xs text-muted-foreground">
            Ще бъдат запазени: продукт, количество, източник, коментар и др.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Запази
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (data: Record<string, any>) => void;
}

export const LoadTemplateDialog: FC<LoadTemplateDialogProps> = ({ open, onOpenChange, onSelect }) => {
  const { templates, loading, deleteTemplate, incrementUsage } = useOrderTemplates();
  const { toast } = useToast();

  const handleSelect = async (template: OrderTemplate) => {
    await incrementUsage(template.id);
    onSelect(template.template_data);
    onOpenChange(false);
    toast({ title: 'Шаблон зареден', description: `"${template.name}" е приложен` });
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteTemplate(id);
      toast({ title: 'Изтрит', description: 'Шаблонът беше изтрит' });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Зареди шаблон
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Няма запазени шаблони
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Използван {t.usage_count || 0} пъти • {format(new Date(t.created_at), 'dd MMM yyyy', { locale: bg })}
                    </div>
                    {t.template_data?.product_name && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Продукт: {t.template_data.product_name}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={e => handleDelete(e, t.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
