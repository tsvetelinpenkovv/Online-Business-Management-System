import { FC, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle2, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface SyncJob {
  id: string;
  job_type: string;
  platform: string | null;
  status: string;
  total_items: number | null;
  processed_items: number | null;
  failed_items: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface SyncJobLog {
  id: string;
  level: string;
  message: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: FC<{ className?: string }> }> = {
  pending: { label: 'Чакащ', variant: 'outline', icon: Clock },
  processing: { label: 'В процес', variant: 'default', icon: Loader2 },
  completed: { label: 'Завършен', variant: 'secondary', icon: CheckCircle2 },
  failed: { label: 'Неуспешен', variant: 'destructive', icon: XCircle },
};

const jobTypeLabels: Record<string, string> = {
  sync_products: 'Синхр. продукти',
  sync_stock: 'Синхр. наличности',
  sync_prices: 'Синхр. цени',
  sync_categories: 'Синхр. категории',
  import: 'Импорт',
  export: 'Експорт',
};

export const SyncJobsPanel: FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<SyncJobLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sync_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) setJobs(data as SyncJob[]);
    setLoading(false);
  }, []);

  const fetchLogs = useCallback(async (jobId: string) => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from('sync_job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) setJobLogs(data as SyncJobLog[]);
    setLogsLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const toggleExpand = (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      setJobLogs([]);
    } else {
      setExpandedJobId(jobId);
      fetchLogs(jobId);
    }
  };

  const getProgress = (job: SyncJob) => {
    if (!job.total_items || job.total_items === 0) return 0;
    return Math.round(((job.processed_items || 0) / job.total_items) * 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Синхронизации</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && jobs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Няма записани синхронизации</p>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const config = statusConfig[job.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const progress = getProgress(job);
              const isExpanded = expandedJobId === job.id;

              return (
                <div key={job.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleExpand(job.id)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon className={`w-4 h-4 flex-shrink-0 ${job.status === 'processing' ? 'animate-spin text-primary' : job.status === 'completed' ? 'text-success' : job.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium truncate">
                          {jobTypeLabels[job.job_type] || job.job_type}
                        </span>
                        {job.platform && (
                          <Badge variant="outline" className="text-xs">
                            {job.platform}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {(job.status === 'processing' || (job.total_items && job.total_items > 0)) && (
                      <div className="mt-2 space-y-1">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{job.processed_items || 0} / {job.total_items || 0} обработени</span>
                          {(job.failed_items || 0) > 0 && (
                            <span className="text-destructive">{job.failed_items} грешки</span>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(job.created_at), 'dd MMM yyyy, HH:mm', { locale: bg })}
                      {job.completed_at && ` • Завършен: ${format(new Date(job.completed_at), 'HH:mm', { locale: bg })}`}
                    </p>

                    {job.error_message && (
                      <p className="text-xs text-destructive mt-1 truncate">{job.error_message}</p>
                    )}
                  </button>

                  {/* Expanded logs */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-3">
                      {logsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : jobLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">Няма логове</p>
                      ) : (
                        <ScrollArea className="max-h-48">
                          <div className="space-y-1">
                            {jobLogs.map((log) => (
                              <div key={log.id} className="flex items-start gap-2 text-xs">
                                <span className={`flex-shrink-0 font-mono px-1 rounded ${
                                  log.level === 'error' ? 'bg-destructive/20 text-destructive' :
                                  log.level === 'warn' ? 'bg-warning/20 text-warning' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {log.level.toUpperCase().padEnd(5)}
                                </span>
                                <span className="text-muted-foreground flex-shrink-0">
                                  {format(new Date(log.created_at), 'HH:mm:ss')}
                                </span>
                                <span className="text-foreground break-all">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
