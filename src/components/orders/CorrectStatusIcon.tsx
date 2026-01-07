import { FC, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type CorrectStatus = 'correct' | 'incorrect' | 'unknown' | 'loading';

interface CorrectStatusIconProps {
  isCorrect: boolean | null;
  isLoading?: boolean;
}

const getStatus = (isCorrect: boolean | null, isLoading?: boolean): CorrectStatus => {
  if (isLoading) return 'loading';
  if (isCorrect === null) return 'unknown';
  return isCorrect ? 'correct' : 'incorrect';
};

const statusConfig: Record<CorrectStatus, { 
  icon: typeof CheckCircle2; 
  className: string;
  message: string;
  popoverClassName: string;
}> = {
  correct: {
    icon: CheckCircle2,
    className: 'text-success',
    message: 'Клиентът е с отлична история на коректност. Всички доставки до него са преминали успешно.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-success/90 backdrop-blur-md border-success/40 text-white'
  },
  incorrect: {
    icon: XCircle,
    className: 'text-destructive',
    message: 'Има регистрирани проблеми при доставки и взаимодействия с този клиент.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-destructive/90 backdrop-blur-md border-destructive/40 text-white'
  },
  unknown: {
    icon: AlertCircle,
    className: 'text-warning',
    message: 'Няма данни за този клиент.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-warning/90 backdrop-blur-md border-warning/40 text-black'
  },
  loading: {
    icon: Loader2,
    className: 'text-muted-foreground animate-spin',
    message: 'Клиентът се проверявя. Проверката може да отнеме няколко минути.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-muted/90 backdrop-blur-md border-muted-foreground/40 text-muted-foreground'
  }
};

export const CorrectStatusIcon: FC<CorrectStatusIconProps> = ({ isCorrect, isLoading = false }) => {
  const [open, setOpen] = useState(false);
  const status = getStatus(isCorrect, isLoading);
  const { icon: Icon, className, message, popoverClassName } = statusConfig[status];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex justify-center cursor-pointer" onClick={() => setOpen(!open)}>
          <Icon className={`w-4 h-4 ${className}`} />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className={`max-w-[250px] whitespace-pre-line text-center text-sm ${popoverClassName}`}
        showArrow
        arrowClassName={
          status === 'correct' ? 'fill-success/90' : 
          status === 'incorrect' ? 'fill-destructive/90' : 
          status === 'unknown' ? 'fill-warning/90' : 
          'fill-muted/90'
        }
      >
        {message}
      </PopoverContent>
    </Popover>
  );
};