import { FC } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
}> = {
  correct: {
    icon: CheckCircle2,
    className: 'text-success',
    message: 'Клиентът е с отлична история на коректност. Всички доставки до него са преминали успешно.\n\nwww.nekorekten.com'
  },
  incorrect: {
    icon: XCircle,
    className: 'text-destructive',
    message: 'Има регистрирани проблеми при доставки и взаимодействия с този клиент.\n\nwww.nekorekten.com'
  },
  unknown: {
    icon: AlertCircle,
    className: 'text-warning',
    message: 'Няма данни за този клиент.\n\nwww.nekorekten.com'
  },
  loading: {
    icon: Loader2,
    className: 'text-muted-foreground animate-spin',
    message: 'Клиентът се проверявя. Проверката може да отнеме няколко минути.\n\nwww.nekorekten.com'
  }
};

export const CorrectStatusIcon: FC<CorrectStatusIconProps> = ({ isCorrect, isLoading = false }) => {
  const status = getStatus(isCorrect, isLoading);
  const { icon: Icon, className, message } = statusConfig[status];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex justify-center cursor-help">
          <Icon className={`w-4 h-4 ${className}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px] whitespace-pre-line text-center">
        {message}
      </TooltipContent>
    </Tooltip>
  );
};