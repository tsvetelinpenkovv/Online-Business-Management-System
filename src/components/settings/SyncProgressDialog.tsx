import { FC, useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Package, 
  Loader2,
  Download,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface SyncLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

export interface SyncStats {
  total: number;
  processed: number;
  synced: number;
  created: number;
  bundles: number;
  errors: number;
}

interface SyncProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformName: string;
  isRunning: boolean;
  stats: SyncStats;
  logs: SyncLogEntry[];
  onClose?: () => void;
}

const LogIcon: FC<{ level: LogLevel }> = ({ level }) => {
  switch (level) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-warning shrink-0" />;
    default:
      return <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('bg-BG', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export const SyncProgressDialog: FC<SyncProgressDialogProps> = ({
  open,
  onOpenChange,
  platformName,
  isRunning,
  stats,
  logs,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const progress = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;
  const hasFinished = !isRunning && stats.processed > 0;
  const hasErrors = stats.errors > 0;

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={isRunning ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : hasErrors ? (
              <AlertCircle className="w-5 h-5 text-warning" />
            ) : hasFinished ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
            Синхронизация: {platformName}
          </DialogTitle>
          <DialogDescription>
            {isRunning 
              ? 'Синхронизацията е в процес...' 
              : hasFinished 
                ? 'Синхронизацията завърши' 
                : 'Готов за синхронизация'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Section */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Прогрес</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            {stats.total > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {stats.processed} от {stats.total} продукта
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.synced}</div>
              <div className="text-xs text-muted-foreground">Обновени</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-success">{stats.created}</div>
              <div className="text-xs text-muted-foreground">Създадени</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.bundles}</div>
              <div className="text-xs text-muted-foreground">Комплекти</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className={cn(
                "text-2xl font-bold",
                stats.errors > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {stats.errors}
              </div>
              <div className="text-xs text-muted-foreground">Грешки</div>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="flex-1 min-h-0 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Лог на синхронизацията</h4>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoScroll(!autoScroll)}
                className={cn(
                  "text-xs h-7",
                  autoScroll && "bg-muted"
                )}
              >
                <Download className="w-3 h-3 mr-1" />
                Авто-скрол
              </Button>
            </div>
          </div>
          
          <ScrollArea ref={scrollRef} className="h-[200px] border rounded-lg bg-muted/30">
            <div className="p-3 space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Логът ще се появи тук при стартиране
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-start gap-2 text-sm py-1 px-2 rounded",
                      log.level === 'error' && "bg-destructive/10",
                      log.level === 'warning' && "bg-warning/10",
                      log.level === 'success' && "bg-success/10"
                    )}
                  >
                    <LogIcon level={log.level} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(log.timestamp)}
                        </span>
                        <span className={cn(
                          "truncate",
                          log.level === 'error' && "text-destructive",
                          log.level === 'warning' && "text-warning",
                          log.level === 'success' && "text-success"
                        )}>
                          {log.message}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 break-all">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          {!isRunning && (
            <Button onClick={handleClose}>
              Затвори
            </Button>
          )}
          {isRunning && (
            <Button disabled variant="outline">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Изчакайте...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
