import { FC, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type CorrectStatus = 'correct' | 'incorrect' | 'unknown' | 'loading' | 'hidden';

interface CorrectStatusIconProps {
  isCorrect: boolean | null;
  isLoading?: boolean;
  isHidden?: boolean;
}

const getStatus = (isCorrect: boolean | null, isLoading?: boolean, isHidden?: boolean): CorrectStatus => {
  if (isHidden) return 'hidden';
  if (isLoading) return 'loading';
  if (isCorrect === null) return 'unknown';
  return isCorrect ? 'correct' : 'incorrect';
};

const statusConfig: Record<CorrectStatus, { 
  icon: typeof CheckCircle2; 
  className: string;
  message: string;
  popoverClassName: string;
  arrowColor: string;
}> = {
  correct: {
    icon: CheckCircle2,
    className: 'text-success',
    message: 'Клиентът е с отлична история на коректност. Всички доставки до него са преминали успешно.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-success/90 backdrop-blur-md border-success/40 text-white',
    arrowColor: 'hsl(142 76% 36% / 0.9)'
  },
  incorrect: {
    icon: XCircle,
    className: 'text-destructive',
    message: 'Има регистрирани проблеми при доставки и взаимодействия с този клиент.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-destructive/90 backdrop-blur-md border-destructive/40 text-white',
    arrowColor: 'hsl(0 84% 60% / 0.9)'
  },
  unknown: {
    icon: AlertCircle,
    className: 'text-warning',
    message: 'Няма данни за този клиент.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-warning/90 backdrop-blur-md border-warning/40 text-black',
    arrowColor: 'hsl(38 92% 50% / 0.9)'
  },
  loading: {
    icon: MoreHorizontal,
    className: 'text-muted-foreground',
    message: 'Клиентът се проверява. Проверката може да отнеме няколко минути.\n\nwww.nekorekten.com',
    popoverClassName: 'bg-muted/90 backdrop-blur-md border-muted-foreground/40 text-foreground',
    arrowColor: 'hsl(210 40% 96% / 0.9)'
  },
  hidden: {
    icon: CheckCircle2,
    className: 'hidden',
    message: '',
    popoverClassName: '',
    arrowColor: ''
  }
};

export const CorrectStatusIcon: FC<CorrectStatusIconProps> = ({ isCorrect, isLoading = false, isHidden = false }) => {
  const [open, setOpen] = useState(false);
  const status = getStatus(isCorrect, isLoading, isHidden);
  
  // Don't render anything if hidden
  if (status === 'hidden') {
    return null;
  }
  
  const { icon: Icon, className, message, popoverClassName, arrowColor } = statusConfig[status];

  // For loading state, show a gray circle with 3 horizontal dots
  const iconElement = status === 'loading' ? (
    <div className="w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center">
      <Icon className="w-3 h-3 text-muted-foreground" />
    </div>
  ) : (
    <Icon className={`w-5 h-5 ${className}`} />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex justify-center cursor-pointer" onClick={() => setOpen(!open)}>
          {iconElement}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className={`max-w-[250px] whitespace-pre-line text-center text-sm ${popoverClassName}`}
        showArrow
        arrowColor={arrowColor}
      >
        {message}
      </PopoverContent>
    </Popover>
  );
};
