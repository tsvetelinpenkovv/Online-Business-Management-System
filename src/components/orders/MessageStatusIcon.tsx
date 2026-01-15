import { forwardRef } from 'react';
import { MessageCircle, Smartphone, Check, CheckCheck, Clock, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MessageStatusIconProps {
  channel: 'viber' | 'sms';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: string;
  className?: string;
}

export const MessageStatusIcon = forwardRef<HTMLDivElement, MessageStatusIconProps>(({ 
  channel, 
  status, 
  sentAt,
  className = '' 
}, ref) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-2 h-2 text-info" />;
      case 'delivered':
        return <Check className="w-2 h-2 text-success" />;
      case 'failed':
        return <XCircle className="w-2 h-2 text-destructive" />;
      default:
        return <Clock className="w-2 h-2 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'read':
        return 'Прочетено';
      case 'delivered':
        return 'Доставено';
      case 'failed':
        return 'Грешка';
      default:
        return 'Изпратено';
    }
  };

  const getChannelColor = () => {
    return channel === 'viber' ? 'text-purple' : 'text-info';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div ref={ref} className={`relative inline-flex ${className}`}>
            {channel === 'viber' ? (
              <MessageCircle className={`w-4 h-4 ${getChannelColor()}`} />
            ) : (
              <Smartphone className={`w-4 h-4 ${getChannelColor()}`} />
            )}
            <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-[1px]">
              {getStatusIcon()}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">{channel === 'viber' ? 'Viber' : 'SMS'} - {getStatusText()}</p>
            {sentAt && (
              <p className="text-muted-foreground">
                {new Date(sentAt).toLocaleString('bg-BG')}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

MessageStatusIcon.displayName = 'MessageStatusIcon';
