import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';

export const SessionTimeoutWarning = () => {
  const { showWarning, remainingSeconds, extendSession, logout } = useSessionTimeout();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Сесията ви изтича
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Поради неактивност, сесията ви ще бъде прекратена след:
            </p>
            <div className="text-3xl font-bold text-center text-amber-600 py-2">
              {formatTime(remainingSeconds)}
            </div>
            <p className="text-sm">
              Натиснете "Остани в системата" за да продължите работата си.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Изход
          </AlertDialogCancel>
          <AlertDialogAction onClick={extendSession}>
            Остани в системата
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
