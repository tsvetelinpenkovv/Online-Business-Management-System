import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Zap, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const QuickCacheClear = ({ size = 'icon' }: { size?: 'icon' | 'sm' }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [state, setState] = useState<'idle' | 'clearing' | 'done'>('idle');

  const handleClear = async () => {
    setState('clearing');
    try {
      // Clear React Query cache
      queryClient.clear();
      await queryClient.invalidateQueries();

      // Clear browser Cache API
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }

      // Clear storage (keep auth + theme)
      const keep = ['app-theme', 'sb-gpmwkgkvikvlzvqpbqus-auth-token'];
      Object.keys(localStorage).forEach(key => {
        if (!keep.some(k => key.includes(k))) localStorage.removeItem(key);
      });
      sessionStorage.clear();

      setState('done');
      toast({ title: '✓ Кешът е изчистен', description: 'Страницата ще се презареди...' });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setState('idle');
      toast({ title: 'Грешка', description: 'Неуспешно изчистване', variant: 'destructive' });
    }
  };

  if (size === 'sm') {
    return (
      <button
        onClick={handleClear}
        disabled={state === 'clearing'}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        {state === 'clearing' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : state === 'done' ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
        Изчисти кеш
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClear}
          disabled={state === 'clearing'}
          title="Изчисти кеша"
        >
          {state === 'clearing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : state === 'done' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Изчисти целия кеш</TooltipContent>
    </Tooltip>
  );
};
