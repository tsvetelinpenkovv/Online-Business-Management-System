import { FC } from 'react';
import { DuplicateOrder } from '@/hooks/useDuplicateDetection';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface DuplicateWarningProps {
  duplicates: DuplicateOrder[];
}

export const DuplicateWarning: FC<DuplicateWarningProps> = ({ duplicates }) => {
  if (duplicates.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Възможни дубликати ({duplicates.length})</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-1">
          {duplicates.map((dup) => (
            <div key={dup.duplicate_id} className="flex items-center justify-between text-xs">
              <span>
                Поръчка #{dup.duplicate_id} ({dup.duplicate_code}) — {format(new Date(dup.duplicate_date), 'dd.MM.yyyy HH:mm', { locale: bg })}
              </span>
              <span className="text-muted-foreground">
                {Math.round(dup.similarity_score * 100)}% сходство
              </span>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};
